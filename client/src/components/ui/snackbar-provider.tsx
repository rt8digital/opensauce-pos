import * as React from "react"
import { useSnackbar } from "@/hooks/use-snackbar"
import { Snackbar } from "@/components/ui/snackbar"

export function SnackbarProvider() {
  const { snackbars } = useSnackbar()

  return (
    <>
      {snackbars.map(function ({ id, title, description, variant, action, ...props }) {
        return (
          <Snackbar
            key={id}
            title={title}
            description={description}
            variant={variant}
            action={action}
            {...props}
          />
        )
      })}
    </>
  )
}
