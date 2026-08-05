'use client';

import type { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type DragHandleProps = {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
};

interface ListaOrdenableProps<T extends { id: string }> {
  items: T[];
  onReordenar: (nuevoOrden: T[]) => void;
  renderItem: (item: T, dragHandleProps: DragHandleProps) => ReactNode;
  className?: string;
}

/**
 * Envoltorio genérico de dnd-kit para reordenar una lista por drag & drop:
 * lo usan la lista de Obras, la sub-galería de una obra y la lista de
 * Proceso. onReordenar recibe el array ya reordenado — quien lo use decide
 * cómo actualizar su estado local y cómo persistir el nuevo `orden`.
 */
export default function ListaOrdenable<T extends { id: string }>({
  items,
  onReordenar,
  renderItem,
  className,
}: ListaOrdenableProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReordenar(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <FilaOrdenable key={item.id} id={item.id}>
              {(dragHandleProps) => renderItem(item, dragHandleProps)}
            </FilaOrdenable>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function FilaOrdenable({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: DragHandleProps) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}
