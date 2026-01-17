import * as React from "react"
import { SnackbarProps } from "@/components/ui/snackbar"

type SnackbarMessage = SnackbarProps & {
  id: string
}

const SNACKBAR_LIMIT = 3
const SNACKBAR_REMOVE_DELAY = 1000

type ActionType =
  | { type: "ADD_SNACKBAR"; snackbar: SnackbarMessage }
  | { type: "UPDATE_SNACKBAR"; snackbar: Partial<SnackbarMessage> }
  | { type: "DISMISS_SNACKBAR"; snackbarId?: string }
  | { type: "REMOVE_SNACKBAR"; snackbarId?: string }

interface State {
  snackbars: SnackbarMessage[]
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const snackbarTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (snackbarId: string) => {
  if (snackbarTimeouts.has(snackbarId)) {
    return
  }

  const timeout = setTimeout(() => {
    snackbarTimeouts.delete(snackbarId)
    dispatch({
      type: "REMOVE_SNACKBAR",
      snackbarId: snackbarId,
    })
  }, SNACKBAR_REMOVE_DELAY)

  snackbarTimeouts.set(snackbarId, timeout)
}

export const reducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case "ADD_SNACKBAR":
      return {
        ...state,
        snackbars: [action.snackbar, ...state.snackbars].slice(0, SNACKBAR_LIMIT),
      }

    case "UPDATE_SNACKBAR":
      return {
        ...state,
        snackbars: state.snackbars.map((s) =>
          s.id === action.snackbar.id ? { ...s, ...action.snackbar } : s
        ),
      }

    case "DISMISS_SNACKBAR": {
      const { snackbarId } = action

      if (snackbarId) {
        addToRemoveQueue(snackbarId)
      } else {
        state.snackbars.forEach((snackbar) => {
          addToRemoveQueue(snackbar.id)
        })
      }

      return {
        ...state,
        snackbars: state.snackbars.map((s) =>
          s.id === snackbarId || snackbarId === undefined
            ? {
                ...s,
              }
            : s
        ),
      }
    }
    case "REMOVE_SNACKBAR":
      if (action.snackbarId === undefined) {
        return {
          ...state,
          snackbars: [],
        }
      }
      return {
        ...state,
        snackbars: state.snackbars.filter((s) => s.id !== action.snackbarId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { snackbars: [] }

function dispatch(action: ActionType) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Snackbar = Omit<SnackbarMessage, "id">

function snackbar({ ...props }: Snackbar) {
  const id = genId()

  const update = (props: SnackbarMessage) =>
    dispatch({
      type: "UPDATE_SNACKBAR",
      snackbar: { ...props, id },
    })
  
  const dismiss = () => dispatch({ type: "DISMISS_SNACKBAR", snackbarId: id })

  dispatch({
    type: "ADD_SNACKBAR",
    snackbar: {
      ...props,
      id,
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useSnackbar() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    snackbar,
    dismiss: (snackbarId?: string) => dispatch({ type: "DISMISS_SNACKBAR", snackbarId }),
  }
}

export { useSnackbar, snackbar }
