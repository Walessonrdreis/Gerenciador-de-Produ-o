import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';

import { filterScheduleByViewType, ViewType } from '../features/planning/planning.domain';
import { usePlanningEngine } from '../features/planning/hooks/usePlanningEngine';
import { useOrderModal } from '../features/planning/hooks/useOrderModal';
import { useAutoPlanModal } from '../features/planning/hooks/useAutoPlanModal';

import { PlanningHeader } from '../features/planning/components/PlanningHeader';
import { PlanningWarnings } from '../features/planning/components/PlanningWarnings';
import { PlanningFilters } from '../features/planning/components/PlanningFilters';
import { PlanningSchedule } from '../features/planning/components/PlanningSchedule';
import { OrderModal } from '../features/planning/components/OrderModal';
import { AutoPlanModal } from '../features/planning/components/AutoPlanModal';

export default function PlanningView() {
  const { schedule, warnings, products } = usePlanningEngine();
  
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    isEditingOrder,
    editingOrderId,
    orderDraft,
    setOrderDraft,
    openCreateOrder,
    openEditOrder,
    saveOrder,
    deleteOrder,
    closeOrderModal
  } = useOrderModal();

  const {
    isCreating,
    createMode,
    setCreateMode,
    manualOrder,
    setManualOrder,
    handleAddManualOrder,
    selectedFamily,
    setSelectedFamily,
    targetStock,
    setTargetStock,
    families,
    isLoadingFamilies,
    autoProducts,
    isLoadingAuto,
    isPendingAutoOrders,
    handleAutoPlan,
    openAutoPlanModal,
    closeAutoPlanModal
  } = useAutoPlanModal();

  const filteredSchedule = useMemo(() => {
    return filterScheduleByViewType(schedule, viewType, selectedDate);
  }, [schedule, viewType, selectedDate]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6">
      <PlanningHeader onAddOrder={openCreateOrder} />
      <PlanningWarnings warnings={warnings} />
      <PlanningFilters 
        viewType={viewType}
        setViewType={setViewType}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onPrint={handlePrint}
        onAutoPlanClick={openAutoPlanModal}
        onNewOrderClick={openCreateOrder}
      />
      
      <div className="print-container">
        <AnimatePresence>
          {isEditingOrder && (
            <OrderModal 
              isEditing={!!editingOrderId}
              orderDraft={orderDraft}
              products={products}
              setOrderDraft={setOrderDraft}
              onClose={closeOrderModal}
              onSave={saveOrder}
            />
          )}
          {isCreating && (
            <AutoPlanModal 
              createMode={createMode}
              setCreateMode={setCreateMode}
              products={products}
              manualOrder={manualOrder}
              setManualOrder={setManualOrder}
              onAddManualOrder={handleAddManualOrder}
              families={families}
              isLoadingFamilies={isLoadingFamilies}
              selectedFamily={selectedFamily}
              setSelectedFamily={setSelectedFamily}
              targetStock={targetStock}
              setTargetStock={setTargetStock}
              isLoadingAuto={isLoadingAuto}
              isPendingAutoOrders={isPendingAutoOrders}
              autoProducts={autoProducts}
              onAutoPlan={handleAutoPlan}
              onClose={closeAutoPlanModal}
            />
          )}
        </AnimatePresence>

        <PlanningSchedule 
          schedule={filteredSchedule}
          products={products}
          viewType={viewType}
          selectedDate={selectedDate}
          onEditOrder={openEditOrder}
          onDeleteOrder={deleteOrder}
        />
      </div>
    </div>
  );
}
