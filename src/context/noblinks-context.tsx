"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import {
  seedMachines,
  seedWidgets,
} from "@/lib/mock-data";
import type { Machine, Alert, Widget, AlertStatus } from "@/lib/types";

// --- State ---

interface NoblinksState {
  machines: Machine[];
  alerts: Alert[];
  widgets: Widget[];
}

const initialState: NoblinksState = {
  machines: seedMachines,
  alerts: [],
  widgets: seedWidgets,
};

// --- Actions ---

type NoblinksAction =
  | { type: "ADD_MACHINE"; payload: Machine }
  | { type: "ADD_ALERT"; payload: Alert }
  | { type: "UPDATE_ALERT_STATUS"; payload: { id: string; status: AlertStatus } }
  | { type: "ADD_WIDGET"; payload: Widget };

function noblinksReducer(
  state: NoblinksState,
  action: NoblinksAction
): NoblinksState {
  switch (action.type) {
    case "ADD_MACHINE":
      return { ...state, machines: [...state.machines, action.payload] };
    case "ADD_ALERT":
      return { ...state, alerts: [action.payload, ...state.alerts] };
    case "UPDATE_ALERT_STATUS":
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.payload.id
            ? { ...a, status: action.payload.status }
            : a
        ),
      };
    case "ADD_WIDGET":
      return { ...state, widgets: [...state.widgets, action.payload] };
    default:
      return state;
  }
}

// --- Context ---

interface NoblinksContextValue extends NoblinksState {
  addMachine: (machine: Machine) => void;
  addAlert: (alert: Alert) => void;
  updateAlertStatus: (id: string, status: AlertStatus) => void;
  addWidget: (widget: Widget) => void;
}

const NoblinksContext = createContext<NoblinksContextValue | null>(null);

// --- Provider ---

export function NoblinksProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(noblinksReducer, initialState);

  const addMachine = (machine: Machine) =>
    dispatch({ type: "ADD_MACHINE", payload: machine });

  const addAlert = (alert: Alert) =>
    dispatch({ type: "ADD_ALERT", payload: alert });

  const updateAlertStatus = (id: string, status: AlertStatus) =>
    dispatch({ type: "UPDATE_ALERT_STATUS", payload: { id, status } });

  const addWidget = (widget: Widget) =>
    dispatch({ type: "ADD_WIDGET", payload: widget });

  return (
    <NoblinksContext.Provider
      value={{
        ...state,
        addMachine,
        addAlert,
        updateAlertStatus,
        addWidget,
      }}
    >
      {children}
    </NoblinksContext.Provider>
  );
}

// --- Hook ---

export function useNoblinks(): NoblinksContextValue {
  const context = useContext(NoblinksContext);
  if (!context) {
    throw new Error("useNoblinks must be used within a NoblinksProvider");
  }
  return context;
}
