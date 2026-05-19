import React from 'react';
import { DisabilitySheet } from './DisabilitySheet';
import { EvSheet } from './EvSheet';
import { MeterSheet } from './MeterSheet';
import { MotorcycleSheet } from './MotorcycleSheet';
import type { SpotReport } from '../../hooks/useSpotReports';
import type { Selection } from '../../types/map';

interface Props {
  selection: Selection;
  onDismiss: () => void;
  getReport: (meterId: string) => SpotReport | undefined;
  submitReport: (meterId: string, type: SpotReport['report_type']) => Promise<boolean>;
}

export function MapSheets({ selection, onDismiss, getReport, submitReport }: Props) {
  return (
    <>
      {selection?.kind === 'meter' && (
        <MeterSheet
          meter={selection.item}
          onDismiss={onDismiss}
          report={getReport(selection.item.meter_id)}
          onReport={(type) => submitReport(selection.item.meter_id, type)}
        />
      )}
      {selection?.kind === 'disability' && (
        <DisabilitySheet spot={selection.item} onDismiss={onDismiss} />
      )}
      {selection?.kind === 'motorcycle' && (
        <MotorcycleSheet spot={selection.item} onDismiss={onDismiss} />
      )}
      {selection?.kind === 'ev' && (
        <EvSheet station={selection.item} onDismiss={onDismiss} />
      )}
    </>
  );
}
