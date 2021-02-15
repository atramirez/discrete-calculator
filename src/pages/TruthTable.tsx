import { Button, createStyles, Grid, makeStyles } from "@material-ui/core"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import MathView, { MathViewRef } from "react-math-view"
import { useParams } from "react-router-dom"
import { LatexTable } from "../components/LatexTable"
import { Notification } from "../components/Notification"
import { buildTable } from "../util/buildTable"

const useStyles = makeStyles((theme) =>
  createStyles({
    gridRoot: {
      paddingTop: 10,
      paddingBottom: 30
    },
    mathfield: {
      minWidth: "25%",
      maxWidth: "50%",
      fontSize: "32px",
      textAlign: "center",
      padding: "8px",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: theme.palette.grey[400]
    },
    button: {
      paddingLeft: "10px"
    },
    table: {
      justifyContent: "center"
    }
  })
)

export const TruthTable = () => {
  const { initialValue } = useParams<{ initialValue?: string }>()
  const classes = useStyles()
  const mathfieldRef = useRef<MathViewRef>(null)
  const [value, setValue] = useState<string>(initialValue ? initialValue : "r→q")

  const process = useCallback(() => {
    if (mathfieldRef.current) {
      setValue(mathfieldRef.current.getValue("ASCIIMath"))
    }
  }, [mathfieldRef])

  useEffect(() => {
    const ref = mathfieldRef.current
    if (ref) {
      ref.setOptions({
        defaultMode: "math",
        smartMode: false,
        smartFence: false,
        macros: {},
        inlineShortcuts: {
          "->": "\\to",
          "<->": "\\leftrightarrow",
          iff: "\\leftrightarrow",
          if: "\\to",
          implies: "\\to",
          to: "\\to",
          not: "\\neg",
          and: "\\wedge",
          or: "\\vee",
          xor: "\\oplus"
        },
        onKeystroke: (_sender, _keystroke, e) => {
          if (e.code === "Enter") {
            process()
            return false
          }
          return true
        }
      })
    }
  }, [mathfieldRef, process])

  const [notificationData, setNotificationData] = useState<{
    message: string
    severity: "info" | "success" | "warning" | "error"
  }>({
    message: "",
    severity: "info"
  })
  const [notificationOpen, setNotificationOpen] = useState(false)
  const onShareClick = useCallback(() => {
    window.navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/truthtable/${value}`)
    setNotificationData({ message: "Share link copied to clipboard!", severity: "info" })
    setNotificationOpen(true)
  }, [value])
  const onNotificationClose = useCallback(() => {
    setNotificationOpen(false)
  }, [])

  const [error, setError] = useState(false)
  const onError = useCallback((error: Error) => {
    setError(true)
    console.error(error)
    setNotificationData({ message: `Failed to parse proposition. See console for details`, severity: "error" })
    setNotificationOpen(true)
  }, [])
  const [columns, data] = useMemo(() => {
    let output: any[] = []
    try {
      output = buildTable(value)
      setError(false)
    } catch (error) {
      onError(error)
    }
    return output
  }, [onError, value])

  return (
    <>
      <Grid container justify="center" alignItems="center" alignContent="center" className={classes.gridRoot}>
        <Grid item className={classes.mathfield}>
          <MathView value={value} ref={mathfieldRef} />
        </Grid>
        <Grid item className={classes.button}>
          <Button variant="contained" color="primary" onClick={process}>
            Go
          </Button>
        </Grid>
        <Grid item className={classes.button}>
          <Button variant="contained" color="primary" onClick={onShareClick}>
            Share
          </Button>
        </Grid>
      </Grid>
      <Notification {...notificationData} open={notificationOpen} onClose={onNotificationClose} />
      <div className={classes.table}>{error ? null : <LatexTable columns={columns} data={data} />}</div>
    </>
  )
}
