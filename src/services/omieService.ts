/**
 * Omie API Service
 * Documentation: https://developer.omie.com.br/service-list/
 */

export interface OmieProduct {
  codigo_produto: number;
  codigo_produto_integracao: string;
  descricao: string;
  unidade: string;
  valor_unitario: number;
  codigo_familia?: number;
  estoque_atual?: number;
}

export interface OmieFamily {
  codigo: number;
  nome: string;
}

const PAGE_SIZE = 50;

type OmieRequestPayload = Record<string, unknown>;

function getErrorMessage(data: Record<string, unknown>, fallback: string): string {
  const message = data.faultstring || data.error || data.mensagem || data.descricao;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

function safeJsonParse(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

async function readResponsePayload(response: Response): Promise<Record<string, unknown>> {
  const rawText = await response.text();
  const asJson = safeJsonParse(rawText);

  if (asJson && typeof asJson === 'object' && asJson !== null) {
    return asJson as Record<string, unknown>;
  }

  if (!rawText.trim()) {
    return { error: `Resposta vazia da API (HTTP ${response.status}).` };
  }

  return { error: rawText };
}

async function omieRequest(
  path: string,
  call: string,
  params: OmieRequestPayload
): Promise<Record<string, unknown>> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      call,
      param: [params]
    })
  });

  const data = await readResponsePayload(response);

  if (!response.ok || data.faultstring) {
    const fallback = data.error
      ? `Erro ao consultar a API da Omie (${call}): ${String(data.error)}`
      : `Erro ao consultar a API da Omie (${call}).`;
    throw new Error(getErrorMessage(data, fallback));
  }

  return data;
}

function extractArray(data: Record<string, unknown>, keys: string[]): Record<string, unknown>[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
    }
  }

  return [];
}

function getTotalPages(data: Record<string, unknown>): number {
  const candidates = [
    data.total_de_paginas,
    data.total_paginas,
    data.totalPages
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 1;
}

function normalizeFamily(item: Record<string, unknown>): OmieFamily | null {
  const codigo = Number(item.codigo ?? item.codigo_familia ?? item.codFamilia);
  const nome = String(item.nome ?? item.nomeFamilia ?? item.descricao ?? item.descricao_familia ?? '').trim();

  if (!Number.isFinite(codigo) || !nome) {
    return null;
  }

  return { codigo, nome };
}

function normalizeProduct(item: Record<string, unknown>): OmieProduct | null {
  const codigoProduto = Number(item.codigo_produto ?? item.codigo);
  const descricao = String(item.descricao ?? '').trim();

  if (!Number.isFinite(codigoProduto) || !descricao) {
    return null;
  }

  const codigoFamilia = Number(item.codigo_familia ?? item.codigoFamilia ?? item.codFamilia ?? item.codigo_familia_produto);
  const estoqueAtual = Number(item.estoque_atual ?? item.quantidade_estoque ?? item.saldo_estoque ?? item.saldo);
  const valorUnitario = Number(item.valor_unitario ?? item.valor ?? 0);

  return {
    codigo_produto: codigoProduto,
    codigo_produto_integracao: String(item.codigo_produto_integracao ?? codigoProduto),
    descricao,
    unidade: String(item.unidade ?? item.unidade_medida ?? 'UN'),
    valor_unitario: Number.isFinite(valorUnitario) ? valorUnitario : 0,
    codigo_familia: Number.isFinite(codigoFamilia) ? codigoFamilia : undefined,
    estoque_atual: Number.isFinite(estoqueAtual) ? estoqueAtual : undefined
  };
}

function dedupeByCode<T extends { codigo: number }>(items: T[]): T[] {
  return Array.from(new Map(items.map(item => [item.codigo, item])).values());
}

function dedupeProducts(items: OmieProduct[]): OmieProduct[] {
  return Array.from(new Map(items.map(item => [item.codigo_produto, item])).values());
}

export async function fetchOmieFamilies(): Promise<OmieFamily[]> {
  const families: OmieFamily[] = [];
  let currentPage = 1;
  let totalPages = 1;

  try {
    do {
      const data = await omieRequest('/api/omie/geral/familias', 'PesquisarFamilias', {
        pagina: currentPage,
        registros_por_pagina: PAGE_SIZE
      });

      const pageItems = extractArray(data, ['cadastros', 'famCadastro', 'familias_cadastro', 'familias'])
        .map(normalizeFamily)
        .filter((item): item is OmieFamily => item !== null);

      families.push(...pageItems);
      totalPages = getTotalPages(data);
      currentPage += 1;
    } while (currentPage <= totalPages);

    return dedupeByCode(families).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } catch (error) {
    console.error('Error fetching families:', error);
    throw error;
  }
}

export async function fetchOmieProducts(page: number = 1, search?: string, familyCode?: number): Promise<OmieProduct[]> {
  const products: OmieProduct[] = [];
  const normalizedSearch = search?.trim().toLowerCase();
  let currentPage = Math.max(page, 1);
  let totalPages = currentPage;
  const shouldFetchAllPages = Boolean(search?.trim() || familyCode);
  const call = familyCode ? 'ListarProdutos' : 'ListarProdutosResumido';
  const arrayKeys = familyCode
    ? ['produto_servico_cadastro', 'produto_servico_resumido', 'produtos']
    : ['produto_servico_resumido', 'produto_servico_cadastro', 'produtos'];

  try {
    do {
      const data = await omieRequest('/api/omie/geral/produtos', call, {
        pagina: currentPage,
        registros_por_pagina: PAGE_SIZE,
        apenas_importado_api: 'N',
        filtrar_apenas_omiepdv: 'N'
      });

      const pageItems = extractArray(data, arrayKeys)
        .map(normalizeProduct)
        .filter((item): item is OmieProduct => item !== null);

      products.push(...pageItems);
      totalPages = Math.max(getTotalPages(data), currentPage);
      currentPage += 1;
    } while (shouldFetchAllPages && currentPage <= totalPages);

    const filtered = dedupeProducts(products).filter(product => {
      const matchesSearch = !normalizedSearch || product.descricao.toLowerCase().includes(normalizedSearch);
      if (!matchesSearch) return false;
      if (!familyCode) return true;
      return product.codigo_familia === familyCode;
    });

    return shouldFetchAllPages ? filtered : filtered;
  } catch (error) {
    console.error('Failed to fetch from Omie:', error);
    throw error;
  }
}
