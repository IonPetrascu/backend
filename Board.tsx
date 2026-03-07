import { DragDropProvider } from '@dnd-kit/react';
import { useEffect, useRef, useState } from 'react';
import ColumnComponent from '../../components/Column';
import Item from '../../components/Item';
import { useParams } from 'react-router';
import { boardsService } from '../../services/board.service';
import type { Card, Column } from '../../types/board';
import ColumnForm from '../../components/ColumnForm/ColumnForm';
import { move } from '@dnd-kit/helpers';
import { cardService } from '../../services/card.service';
import { columnService } from '../../services/column.service';

const Board = () => {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [cardsByColumn, setCardsByColumn] = useState<Record<string, Card[]>>({});
  const [columnTitles, setColumnTitles] = useState<Record<number, string>>({});

  const cardsByColumnRef = useRef<Record<string, Card[]>>({});
  const dragStartCardsRef = useRef<Record<string, Card[]>>({});
  const columnOrderRef = useRef<string[]>([]);

  const { id } = useParams();
  const boardId = Number(id);

  useEffect(() => {
    boardsService.getById(boardId).then((data) => {
      const ids = data.columns.map((c) => `col-${c.id}`);
      const cards: Record<string, Card[]> = {};
      const titles: Record<number, string> = {};

      data.columns.forEach((col) => {
        titles[col.id] = col.title;
        cards[`col-${col.id}`] = col.cards;
      });
      setColumnTitles(titles);
      setColumnOrder(ids);
      setCardsByColumn(cards);
    });
  }, [id, boardId]);

  useEffect(() => {
    cardsByColumnRef.current = cardsByColumn;
  }, [cardsByColumn]);

  useEffect(() => {
    columnOrderRef.current = columnOrder;
  }, [columnOrder]);

  const handleColumnCreated = (column: Column) => {
    setColumnOrder((prev) => [...prev, `col-${column.id}`]);
    setColumnTitles((prev) => ({ ...prev, [column.id]: column.title }));
    setCardsByColumn((prev) => ({ ...prev, [`col-${column.id}`]: [] }));
  };

  const handleCardCreated = (colId: number, card: Card) => {
    setCardsByColumn((prev) => ({
      ...prev,
      [`col-${colId}`]: [...(prev[`col-${colId}`] ?? []), card],
    }));
  };

  return (
    <>
      {id && <ColumnForm boardId={boardId} onSuccess={handleColumnCreated} />}
      <DragDropProvider
        onDragOver={(event) => {
          const { source } = event.operation;

          if (source?.type === 'column') {
            setColumnOrder((cols) => move(cols, event));
            return;
          }

          setCardsByColumn((cards) => move(cards, event));
        }}
        onDragStart={() => {
          dragStartCardsRef.current = { ...cardsByColumnRef.current };
        }}
        onDragEnd={(event) => {
          if (event.canceled) return;
          const { source } = event.operation;
          if (!source) return;

          if (source.type === 'column') {
            const colKey = source.id as string;
            const colId = Number(colKey.replace('col-', ''));
            const newIndex = columnOrderRef.current.indexOf(colKey);
            columnService.update(boardId, colId, { position: newIndex });
          }

          if (source.type === 'item') {
            const cards = cardsByColumnRef.current;

            // Найти новую колонку и позицию
            let newColKey: string | null = null;
            let newPosition = 0;
            for (const [colKey, colCards] of Object.entries(cards)) {
              const idx = colCards.findIndex((c) => c.id === source.id);
              if (idx !== -1) {
                newColKey = colKey;
                newPosition = idx;
                break;
              }
            }

            // Найти оригинальную колонку
            let originalColKey: string | null = null;
            for (const [colKey, colCards] of Object.entries(dragStartCardsRef.current)) {
              if (colCards.some((c) => c.id === source.id)) {
                originalColKey = colKey;
                break;
              }
            }

            if (originalColKey && newColKey) {
              const originalColId = Number(originalColKey.replace('col-', ''));
              const newColId = Number(newColKey.replace('col-', ''));
              cardService.update(boardId, originalColId, source.id as number, {
                position: newPosition,
                ...(newColId !== originalColId && { columnId: newColId }),
              });
            }
          }
        }}
      >
        <div className="flex gap-3">
          {columnOrder.map((colKey, colIndex) => {
            const colId = Number(colKey.replace('col-', ''));
            return (
              <ColumnComponent
                key={colKey}
                id={colKey}
                title={columnTitles[colId] ?? ''}
                index={colIndex}
                boardId={boardId}
                onCardCreated={(card) => handleCardCreated(colId, card)}
              >
                {(cardsByColumn[colKey] ?? []).map((card, cardIndex) => (
                  <Item key={card.id} id={card.id} index={cardIndex} column={colKey} />
                ))}
              </ColumnComponent>
            );
          })}
        </div>
      </DragDropProvider>
    </>
  );
};

export default Board;
