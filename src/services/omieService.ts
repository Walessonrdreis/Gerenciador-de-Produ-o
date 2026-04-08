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

const APP_KEY = import.meta.env.VITE_OMIE_APP_KEY;
const APP_SECRET = import.meta.env.VITE_OMIE_APP_SECRET;

export async function fetchOmieFamilies(): Promise<OmieFamily[]> {
  if (!APP_KEY || !APP_SECRET) {
    return [
      { codigo: 1, nome: 'Barras' },
      { codigo: 2, nome: 'Bombons' },
      { codigo: 3, nome: 'Insumos' }
    ];
  }

  try {
    const response = await fetch('/api/omie/geral/familias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call: 'ListarFamilias',
        param: [{ pagina: 1, registros_por_pagina: 100 }]
      })
    });
    const data = await response.json();
    return data.familias_cadastro || [];
  } catch (error) {
    console.error('Error fetching families:', error);
    return [];
  }
}

export async function fetchOmieProducts(page: number = 1, search?: string, familyCode?: number): Promise<OmieProduct[]> {
  // If no keys are provided, return mock data for demonstration
  if (!APP_KEY || !APP_SECRET) {
    console.warn('OMIE API keys not found. Returning mock data.');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network lag
    
    const mockProducts: OmieProduct[] = [
      { codigo_produto: 101, codigo_produto_integracao: 'OM-001', descricao: 'Barra de Chocolate 1kg', unidade: 'UN', valor_unitario: 45.0, codigo_familia: 1, estoque_atual: 5 },
      { codigo_produto: 102, codigo_produto_integracao: 'OM-002', descricao: 'Bombom Trufado Cx 12', unidade: 'CX', valor_unitario: 28.5, codigo_familia: 2, estoque_atual: 2 },
      { codigo_produto: 103, codigo_produto_integracao: 'OM-003', descricao: 'Chocolate Branco 500g', unidade: 'UN', valor_unitario: 22.0, codigo_familia: 1, estoque_atual: 15 },
      { codigo_produto: 104, codigo_produto_integracao: 'OM-004', descricao: 'Granulado Gourmet 2kg', unidade: 'KG', valor_unitario: 65.0, codigo_familia: 3, estoque_atual: 10 },
      { codigo_produto: 105, codigo_produto_integracao: 'OM-005', descricao: 'Cacau em Pó Extra 1kg', unidade: 'KG', valor_unitario: 55.0, codigo_familia: 3, estoque_atual: 8 },
    ];

    let filtered = mockProducts;
    if (search) {
      filtered = filtered.filter(p => p.descricao.toLowerCase().includes(search.toLowerCase()));
    }
    if (familyCode) {
      filtered = filtered.filter(p => p.codigo_familia === familyCode);
    }
    return filtered;
  }

  try {
    const response = await fetch('/api/omie/geral/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        call: 'ListarProdutosResumido',
        param: [
          {
            pagina: page,
            registros_por_pagina: 50,
            apenas_importado_api: 'N',
            filtrar_por_descricao: search || undefined,
            filtrar_por_familia: familyCode || undefined
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.faultstring) {
      throw new Error(`Omie API Fault: ${data.faultstring}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Omie API error: ${response.statusText}`);
    }

    return data.produto_servico_resumido || [];
  } catch (error) {
    console.error('Failed to fetch from Omie:', error);
    throw error;
  }
}
