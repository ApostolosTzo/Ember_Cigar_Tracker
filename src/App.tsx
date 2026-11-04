import { useEffect, useMemo, useRef, useState } from "react"

type Context = "Home" | "University" | "Out with friends" | "Driving"
type View = "Dashboard" | "Calendar" | "Insights" | "Settings"
type SmokeEvent = { id: string; context: Context; timestamp: string }
type EventStore = Record<string, SmokeEvent[]>

const viewOrder: View[] = ["Dashboard", "Calendar", "Insights", "Settings"]

const contexts: { name: Context; subtitle: string; icon: IconName }[] = [
  { name: "Home", subtitle: "At your place", icon: "home" },
  { name: "University", subtitle: "On campus", icon: "university" },
  { name: "Out with friends", subtitle: "Social occasions", icon: "users" },
  { name: "Driving", subtitle: "On the road", icon: "car" },
]

type IconName = "home" | "university" | "users" | "car" | "grid" | "calendar" | "chart" | "settings" | "cigar" | "chevronLeft" | "chevronRight" | "download" | "upload" | "clock" | "plus" | "minus"

const iconPaths: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  university: (
    <>
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M7 12v5c3 2 7 2 10 0v-5" />
      <path d="M21 9v7" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  car: (
    <>
      <path d="m5 17-2-2v-4l2-2 2-4h10l2 4 2 2v4l-2 2" />
      <path d="M5 17h14v3h-3v-3H8v3H5v-3Z" />
      <circle cx="7.5" cy="12.5" r="1" />
      <circle cx="16.5" cy="12.5" r="1" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-1.55V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9a1.7 1.7 0 0 0 1.56 1.03H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </>
  ),
  cigar: (
    <>
      <path d="M3 14.5 15.5 2l6.5 6.5L9.5 21H3v-6.5Z" />
      <path d="m14 3.5 6.5 6.5M5.5 13 11 18.5M3 17h5" />
    </>
  ),
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  download: (
    <>
      <path d="M12 3v12m0 0 5-5m-5 5-5-5" />
      <path d="M5 21h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m0 0 5 5m-5-5L7 9" />
      <path d="M5 21h14" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
}

function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

const pad = (n: number) => String(n).padStart(2, "0")
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}
const sameMonth = (a: Date, b: Date) =>
  a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
const monthName = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
const shortDate = (key: string) =>
  parseKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

function loadEvents(): EventStore {
  try {
    const saved = localStorage.getItem("ember-events")
    if (!saved) return {}
    const store: EventStore = JSON.parse(saved)
    // Early builds seeded demo entries with date-based ids ("2026-09-01-3");
    // real entries use UUIDs, so drop the demo data once, silently.
    let changed = false
    for (const key of Object.keys(store)) {
      const list = store[key] ?? []
      const kept = list.filter(
        (event) => !/^\d{4}-\d{2}-\d{2}-\d+$/.test(event.id),
      )
      if (kept.length !== list.length) changed = true
      if (kept.length) store[key] = kept
      else delete store[key]
    }
    if (changed) localStorage.setItem("ember-events", JSON.stringify(store))
    return store
  } catch {
    return {}
  }
}

function periodFor(hour: number) {
  if (hour < 12) return "Morning"
  if (hour < 17) return "Afternoon"
  if (hour < 21) return "Evening"
  return "Late night"
}

function heatColor(count: number, max: number) {
  if (count === 0) return "#e7e6df"
  const ratio = Math.min(count / max, 1)
  if (ratio <= 0.18) return "#1d6049"
  if (ratio <= 0.42) return "#5f9873"
  if (ratio <= 0.68) return "#bbd6ae"
  if (ratio <= 0.88) return "#d17a58"
  return "#9f3030"
}

function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  const out: Date[] = []
  const cursor = new Date(start)
  while (out.length < 42) {
    out.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return { days: out, last }
}

function App() {
  const today = new Date()
  const todayKey = dateKey(today)
  const [view, setView] = useState<View>("Dashboard")
  const [events, setEvents] = useState<EventStore>(loadEvents)
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [threshold, setThreshold] = useState(
    () => Number(localStorage.getItem("ember-threshold")) || 10,
  )
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(
    () => localStorage.setItem("ember-events", JSON.stringify(events)),
    [events],
  )
  useEffect(
    () => localStorage.setItem("ember-threshold", String(threshold)),
    [threshold],
  )

  /* Swipe horizontally on touch screens to move between views. */
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    // Needs to be a real horizontal swipe, not a scroll or a tap.
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    const index = viewOrder.indexOf(view)
    const next = dx < 0 ? index + 1 : index - 1
    if (next >= 0 && next < viewOrder.length) setView(viewOrder[next])
  }

  const dayEvents = events[selectedDate] || []
  const todayEvents = events[todayKey] || []
  const selectedCounts = Object.fromEntries(
    contexts.map((c) => [
      c.name,
      dayEvents.filter((e) => e.context === c.name).length,
    ]),
  ) as Record<Context, number>

  const monthEvents = useMemo(
    () =>
      Object.entries(events).flatMap(([key, list]) =>
        sameMonth(parseKey(key), visibleMonth) ? list : [],
      ),
    [events, visibleMonth],
  )
  const monthTotal = monthEvents.length
  const priorMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() - 1,
    1,
  )
  const priorTotal = Object.entries(events).reduce(
    (sum, [key, list]) =>
      sum + (sameMonth(parseKey(key), priorMonth) ? list.length : 0),
    0,
  )
  const change = priorTotal
    ? Math.round(((monthTotal - priorTotal) / priorTotal) * 100)
    : 0

  const addEvent = (context: Context) => {
    const isToday = selectedDate === todayKey
    const base = isToday ? new Date() : new Date(`${selectedDate}T19:30:00`)
    const event: SmokeEvent = {
      id: crypto.randomUUID(),
      context,
      timestamp: base.toISOString(),
    }
    setEvents((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), event],
    }))
  }

  const removeEvent = (context: Context) => {
    setEvents((prev) => {
      const list = [...(prev[selectedDate] || [])]
      const index = list.map((e) => e.context).lastIndexOf(context)
      if (index < 0) return prev
      list.splice(index, 1)
      return { ...prev, [selectedDate]: list }
    })
  }

  const moveMonth = (delta: number) =>
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1),
    )
  const selectDay = (key: string) => {
    setSelectedDate(key)
    if (view === "Dashboard")
      setVisibleMonth(
        new Date(parseKey(key).getFullYear(), parseKey(key).getMonth(), 1),
      )
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ events, threshold }, null, 2)], {
      type: "application/json",
    })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `ember-backup-${todayKey}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importData = async (file?: File) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!data.events || typeof data.events !== "object") throw new Error()
      setEvents(data.events)
      if (data.threshold)
        setThreshold(Math.max(3, Math.min(30, Number(data.threshold))))
    } catch {
      window.alert("That file is not a valid Ember backup.")
    }
  }

  return (
    <div
      className="min-h-screen bg-[#f4f1e9] text-[#1b2922]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-[#d8d2c4] bg-[#faf8f2]/95 backdrop-blur">
        <div className="flex h-full items-center px-5 md:px-8">
          <button
            className="flex items-center gap-2.5"
            onClick={() => setView("Dashboard")}
            aria-label="Ember home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#193f31] text-[#f4d9a2]">
              <Icon name="cigar" size={17} />
            </span>
            <span className="font-display text-[20px] font-semibold tracking-[-.03em]">
              Ember
            </span>
          </button>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d8d2c4] bg-[#faf8f2] md:bottom-auto md:right-auto md:top-14 md:h-[calc(100vh-56px)] md:w-[218px] md:border-r md:border-t-0">
        <nav className="flex items-center justify-around p-2 md:flex-col md:items-stretch md:gap-1 md:p-5">
          {([
            ["Dashboard", "grid"],
            ["Calendar", "calendar"],
            ["Insights", "chart"],
            ["Settings", "settings"],
          ] as [View, IconName][]).map(([label, icon]) => (
            <button
              key={label}
              onClick={() => setView(label)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                view === label
                  ? "bg-[#e5eadf] text-[#184332]"
                  : "text-[#70766f] hover:bg-[#eeeae0] hover:text-[#26362e]"
              }`}
            >
              <Icon name={icon} size={18} />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 hidden rounded-xl bg-[#1d4334] p-4 text-[#f8f3e8] md:block">
          <p className="font-display text-lg">A quieter habit.</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#b9cbbf]">
            Small observations lead to better choices.
          </p>
        </div>
      </aside>

      <main className="min-h-screen px-5 pb-28 pt-[88px] md:ml-[218px] md:px-8 md:pb-12 lg:px-11">
        {view === "Dashboard" && (
          <Dashboard
            today={today}
            todayEvents={todayEvents}
            selectedDate={selectedDate}
            selectedCounts={selectedCounts}
            dayEvents={dayEvents}
            events={events}
            visibleMonth={visibleMonth}
            threshold={threshold}
            monthTotal={monthTotal}
            change={change}
            addEvent={addEvent}
            removeEvent={removeEvent}
            moveMonth={moveMonth}
            selectDay={selectDay}
            openCalendar={() => setView("Calendar")}
            openInsights={() => setView("Insights")}
          />
        )}
        {view === "Calendar" && (
          <CalendarView
            events={events}
            month={visibleMonth}
            selectedDate={selectedDate}
            threshold={threshold}
            moveMonth={moveMonth}
            selectDay={selectDay}
            counts={selectedCounts}
            dayEvents={dayEvents}
          />
        )}
        {view === "Insights" && (
          <InsightsView
            events={events}
            month={visibleMonth}
            moveMonth={moveMonth}
          />
        )}
        {view === "Settings" && (
          <SettingsView
            threshold={threshold}
            setThreshold={setThreshold}
            exportData={exportData}
            importClick={() => importRef.current?.click()}
          />
        )}
      </main>
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => importData(e.target.files?.[0])}
      />
    </div>
  )
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#a06f36]">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-[-.035em] text-[#17291f] md:text-[44px]">
          {title}
        </h1>
        {description !==
          "Keep a mindful record of the moments that make up your day." && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6f766f]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

type DashboardProps = {
  today: Date
  todayEvents: SmokeEvent[]
  selectedDate: string
  selectedCounts: Record<Context, number>
  dayEvents: SmokeEvent[]
  events: EventStore
  visibleMonth: Date
  threshold: number
  monthTotal: number
  change: number
  addEvent: (c: Context) => void
  removeEvent: (c: Context) => void
  moveMonth: (d: number) => void
  selectDay: (k: string) => void
  openCalendar: () => void
  openInsights: () => void
}

function Dashboard(p: DashboardProps) {
  const todayKey = dateKey(p.today)
  const loggingToday = p.selectedDate === todayKey
  return (
    <>
      <PageIntro
        eyebrow={p.today.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title={loggingToday ? "Good afternoon." : shortDate(p.selectedDate)}
        description={
          loggingToday
            ? "Keep a mindful record of the moments that make up your day."
            : "Review or adjust the details recorded on this day."
        }
        action={
          !loggingToday && (
            <button
              onClick={() => p.selectDay(todayKey)}
              className="btn-secondary"
            >
              Return to today
            </button>
          )
        }
      />

      <section className="mb-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-label">
            {loggingToday ? "Quick log" : "Edit this day"}
          </h2>
          <span className="text-xs text-[#858a82]">
            {p.dayEvents.length} {p.dayEvents.length === 1 ? "cigar" : "cigars"}{" "}
            recorded
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {contexts.map((context) => (
            <CounterCard
              key={context.name}
              context={context}
              count={p.selectedCounts[context.name]}
              add={() => p.addEvent(context.name)}
              remove={() => p.removeEvent(context.name)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_.8fr]">
        <div className="panel p-5 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="panel-title">Your rhythm</h2>
              <p className="panel-subtitle">
                Daily activity for {monthName(p.visibleMonth)}
              </p>
            </div>
            <MonthControls month={p.visibleMonth} move={p.moveMonth} />
          </div>
          <Heatmap
            events={p.events}
            month={p.visibleMonth}
            selectedDate={p.selectedDate}
            threshold={p.threshold}
            onSelect={p.selectDay}
          />
          <button
            onClick={p.openCalendar}
            className="mt-5 text-xs font-bold text-[#285b46] hover:underline"
          >
            Open full calendar
          </button>
        </div>

        <div className="panel flex flex-col p-5 md:p-6">
          <h2 className="panel-title">This month</h2>
          <p className="panel-subtitle">{monthName(p.visibleMonth)}</p>
          <div className="my-7 flex items-end gap-3">
            <span className="font-display text-6xl leading-none font-semibold tracking-[-.06em]">
              {p.monthTotal}
            </span>
            <span className="mb-1.5 text-sm text-[#747b73]">cigars</span>
          </div>
          <div className="h-px bg-[#e4dfd3]" />
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="text-[#737b73]">vs. last month</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                p.change <= 0
                  ? "bg-[#e0ede4] text-[#276047]"
                  : "bg-[#f3dfd8] text-[#9b4337]"
              }`}
            >
              {p.change > 0 ? "+" : ""}
              {p.change}%
            </span>
          </div>
          <button onClick={p.openInsights} className="btn-dark mt-auto pt-3">
            View detailed insights <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <TimeCard events={p.events} />
        <RecentActivity events={p.dayEvents} />
      </section>
    </>
  )
}

function CounterCard({
  context,
  count,
  add,
  remove,
}: {
  context: typeof contexts[number]
  count: number
  add: () => void
  remove: () => void
}) {
  return (
    <div className="panel flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf0e9] text-[#315b48]">
        <Icon name={context.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{context.name}</p>
        <p className="truncate text-[11px] text-[#8b8e87]">
          {context.subtitle}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={remove}
          disabled={count === 0}
          className="counter-button"
          aria-label={`Remove ${context.name}`}
        >
          <Icon name="minus" size={13} />
        </button>
        <span className="w-4 text-center font-display text-xl font-semibold">
          {count}
        </span>
        <button
          onClick={add}
          className="counter-button bg-[#1d4938]! text-white! hover:bg-[#123a2b]!"
          aria-label={`Add ${context.name}`}
        >
          <Icon name="plus" size={13} />
        </button>
      </div>
    </div>
  )
}

function MonthControls({
  month,
  move,
}: {
  month: Date
  move: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        className="icon-button"
        onClick={() => move(-1)}
        aria-label="Previous month"
      >
        <Icon name="chevronLeft" size={16} />
      </button>
      <span className="hidden min-w-[112px] text-center text-xs font-bold sm:block">
        {monthName(month)}
      </span>
      <button
        className="icon-button"
        onClick={() => move(1)}
        aria-label="Next month"
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  )
}

function Heatmap({
  events,
  month,
  selectedDate,
  threshold,
  onSelect,
}: {
  events: EventStore
  month: Date
  selectedDate: string
  threshold: number
  onSelect: (key: string) => void
}) {
  const { days } = monthDays(month)
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-[#9a9c95]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const key = dateKey(day)
          const count = events[key]?.length || 0
          const active = sameMonth(day, month)
          return (
            <button
              key={key}
              onClick={() => active && onSelect(key)}
              title={`${shortDate(key)}: ${count} cigars`}
              className={`heat-cell group relative aspect-square min-h-7 rounded-[5px] transition hover:-translate-y-0.5 hover:ring-2 hover:ring-[#bc8d4d]/40 ${
                selectedDate === key
                  ? "ring-2 ring-[#172d24] ring-offset-2"
                  : ""
              } ${!active ? "opacity-20" : ""}`}
              style={{ background: heatColor(count, threshold) }}
            >
              <span
                className={`absolute left-1.5 top-1 text-[9px] font-bold ${
                  count && count / threshold < 0.7
                    ? "text-white/85"
                    : "text-[#5c625c]"
                }`}
              >
                {day.getDate()}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-[#8a8e87]">
        <span>Low</span>
        {[0, 0.12, 0.35, 0.58, 0.78, 1].map((n) => (
          <i
            key={n}
            className="h-3 w-3 rounded-[3px]"
            style={{
              background: heatColor(Math.round(n * threshold), threshold),
            }}
          />
        ))}
        <span>High</span>
      </div>
    </div>
  )
}

function TimeCard({ events }: { events: EventStore }) {
  const all = Object.values(events).flat()
  const periods = ["Morning", "Afternoon", "Evening", "Late night"]
  const data = periods.map((period) => ({
    period,
    count: all.filter(
      (e) => periodFor(new Date(e.timestamp).getHours()) === period,
    ).length,
  }))
  const max = Math.max(...data.map((d) => d.count), 1)
  const peak = data.reduce((a, b) => (a.count > b.count ? a : b))
  return (
    <div className="panel p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="panel-title">Time of day</h2>
          <p className="panel-subtitle">When you tend to light up</p>
        </div>
        <span className="tag">
          <Icon name="clock" size={13} /> Peak: {peak.period}
        </span>
      </div>
      <div className="mt-7 grid grid-cols-4 items-end gap-3">
        {data.map((item, i) => (
          <div key={item.period} className="text-center">
            <div className="mx-auto flex h-24 max-w-[38px] items-end overflow-hidden rounded-t-md bg-[#edf0e9]">
              <div
                className={`w-full rounded-t-md ${
                  i === data.indexOf(peak) ? "bg-[#c58c48]" : "bg-[#517b64]"
                }`}
                style={{ height: `${Math.max(12, (item.count / max) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] font-semibold text-[#747b74]">
              {item.period}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivity({ events }: { events: SmokeEvent[] }) {
  const recent = [...events]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 4)
  return (
    <div className="panel p-5 md:p-6">
      <h2 className="panel-title">Selected day</h2>
      <p className="panel-subtitle">Precise timestamps for your latest logs</p>
      <div className="mt-4">
        {recent.length ? (
          recent.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 border-b border-[#e7e2d8] py-2.5 last:border-0"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#edf0e9] text-[#315b48]">
                <Icon
                  name={contexts.find((c) => c.name === event.context)!.icon}
                  size={15}
                />
              </div>
              <span className="flex-1 text-sm font-semibold">
                {event.context}
              </span>
              <span className="text-xs text-[#7d837c]">
                {new Date(event.timestamp).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-[#8b8f88]">
            Nothing recorded on this day yet.
          </p>
        )}
      </div>
    </div>
  )
}

type CalendarProps = {
  events: EventStore
  month: Date
  selectedDate: string
  threshold: number
  moveMonth: (n: number) => void
  selectDay: (k: string) => void
  counts: Record<Context, number>
  dayEvents: SmokeEvent[]
}
function CalendarView(p: CalendarProps) {
  return (
    <>
      <PageIntro
        eyebrow="Daily archive"
        title="Calendar"
        description="Move through your history and select any day to inspect or update its record."
        action={<MonthControls month={p.month} move={p.moveMonth} />}
      />
      <div className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
        <div className="panel p-5 md:p-7">
          <Heatmap
            events={p.events}
            month={p.month}
            selectedDate={p.selectedDate}
            threshold={p.threshold}
            onSelect={p.selectDay}
          />
        </div>
        <div className="panel p-5 md:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9b7042]">
            Selected day
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {shortDate(p.selectedDate)}
          </h2>
          <p className="mt-1 text-sm text-[#7b817a]">
            {p.dayEvents.length} total cigars
          </p>
          <div className="mt-5 space-y-2.5">
            {contexts.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-3 rounded-lg bg-[#f5f3ed] p-3"
              >
                <Icon name={c.icon} size={16} />
                <span className="flex-1 text-xs font-bold">{c.name}</span>
                <span className="font-display text-lg font-semibold">
                  {p.counts[c.name]}
                </span>
              </div>
            ))}
          </div>
          {p.dayEvents.length > 0 && (
            <div className="mt-5 border-t border-[#e4ded2] pt-4">
              <p className="section-label mb-2">Time breakdown</p>
              {["Morning", "Afternoon", "Evening", "Late night"].map(
                (period) => (
                  <div
                    className="flex justify-between py-1 text-xs"
                    key={period}
                  >
                    <span className="text-[#747b74]">{period}</span>
                    <b>
                      {
                        p.dayEvents.filter(
                          (e) =>
                            periodFor(new Date(e.timestamp).getHours()) ===
                            period,
                        ).length
                      }
                    </b>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function InsightsView({
  events,
  month,
  moveMonth,
}: {
  events: EventStore
  month: Date
  moveMonth: (n: number) => void
}) {
  const list = Object.entries(events).flatMap(([key, ev]) =>
    sameMonth(parseKey(key), month) ? ev : [],
  )
  const byContext = contexts.map((c) => ({
    ...c,
    count: list.filter((e) => e.context === c.name).length,
  }))
  const max = Math.max(...byContext.map((c) => c.count), 1)
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const activeDays = Object.entries(events).filter(
    ([k, v]) => sameMonth(parseKey(k), month) && v.length,
  ).length
  return (
    <>
      <PageIntro
        eyebrow="Patterns & perspective"
        title="Insights"
        description="Understand the settings and moments that shape your routine."
        action={<MonthControls month={month} move={moveMonth} />}
      />
      <div className="grid gap-5 md:grid-cols-3">
        <Stat
          label="Monthly total"
          value={String(list.length)}
          note={`${month.toLocaleDateString("en-US", { month: "long" })} activity`}
        />
        <Stat
          label="Daily average"
          value={(list.length / days).toFixed(1)}
          note="Across the full month"
        />
        <Stat
          label="Active days"
          value={String(activeDays)}
          note={`${Math.round((activeDays / days) * 100)}% of the month`}
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="panel p-6">
          <h2 className="panel-title">Where it happens</h2>
          <p className="panel-subtitle">Monthly frequency by context</p>
          <div className="mt-7 space-y-5">
            {byContext.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="flex items-center gap-2 font-bold">
                    <Icon name={item.icon} size={15} />
                    {item.name}
                  </span>
                  <b>{item.count}</b>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#e9e7df]">
                  <div
                    className="h-full rounded-full bg-[#36644e]"
                    style={{ width: `${(item.count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <TimeCard
          events={Object.fromEntries(
            Object.entries(events).filter(([k]) =>
              sameMonth(parseKey(k), month),
            ),
          )}
        />
      </div>
    </>
  )
}

function Stat({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="panel p-5">
      <p className="section-label">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-[#838880]">{note}</p>
    </div>
  )
}

function SettingsView({
  threshold,
  setThreshold,
  exportData,
  importClick,
}: {
  threshold: number
  setThreshold: (n: number) => void
  exportData: () => void
  importClick: () => void
}) {
  return (
    <>
      <PageIntro
        eyebrow="Make it yours"
        title="Settings"
        description="Adjust the way your activity is displayed and keep a portable copy of your records."
      />
      <div className="max-w-3xl space-y-5">
        <div className="panel p-6">
          <h2 className="panel-title">Heatmap scale</h2>
          <p className="panel-subtitle">
            Set the daily amount that displays as the highest-intensity red.
          </p>
          <div className="mt-7 flex items-center gap-5">
            <input
              aria-label="Maximum heatmap threshold"
              type="range"
              min="3"
              max="20"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="accent-[#285b46] flex-1"
            />
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-[#eef0e9] font-display text-2xl font-bold">
              {threshold}
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-[10px] text-[#7d837b]">
            <span>0</span>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((n) => (
              <i
                key={n}
                className="h-5 flex-1 rounded"
                style={{
                  background: heatColor(Math.round(n * threshold), threshold),
                }}
              />
            ))}
            <span>{threshold}+</span>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="panel-title">Your data</h2>
          <p className="panel-subtitle">
            Your records stay in this browser. Export a backup before clearing
            your device.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={exportData} className="btn-dark">
              <Icon name="download" size={16} /> Export JSON
            </button>
            <button onClick={importClick} className="btn-secondary">
              <Icon name="upload" size={16} /> Import backup
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-[#dacdb8] bg-[#f2e8d8] p-5 text-sm leading-relaxed text-[#65513b]">
          <strong className="text-[#3e3327]">A note on privacy.</strong> Ember
          does not send your activity anywhere. All timestamps and records are
          stored locally on this device.
        </div>
      </div>
    </>
  )
}

export default App
