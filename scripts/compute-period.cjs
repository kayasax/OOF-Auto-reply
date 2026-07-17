const DAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseArgs(values) {
  return Object.fromEntries(
    values.map((value) => {
      const [key, ...rest] = value.replace(/^--/, "").split("=");
      return [key, rest.join("=") || true];
    }),
  );
}

function parseDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) throw new Error(`${label} must be YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a valid date`);
  }
  return date;
}

function addDays(value, count) {
  const date = parseDate(value, "date");
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function computePeriod({ today, workingDays, workStart, workEnd, oofDates = [], holidayDates = [] }) {
  const current = parseDate(today, "today");
  const configuredDays = new Set(workingDays);
  const oof = new Set(oofDates);
  const holidays = new Set(holidayDates);

  if (configuredDays.size === 0 || [...configuredDays].some((day) => !DAY_CODES.includes(day))) {
    throw new Error("workingDays must contain Mon through Sun values");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(workStart || "")) throw new Error("workStart must be HH:MM");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(workEnd || "")) throw new Error("workEnd must be HH:MM");
  for (const value of [...oof, ...holidays]) parseDate(value, "OOF or holiday date");

  const isConfiguredWorkday = (date) => configuredDays.has(DAY_CODES[parseDate(date, "date").getUTCDay()]);
  const isUnavailable = (date) => !isConfiguredWorkday(date) || oof.has(date) || holidays.has(date);
  const status = oof.has(today) || holidays.has(today) ? "away" : "workday";
  const traversedNonWorkingDates = [];
  let cursor = addDays(today, 1);

  while (isUnavailable(cursor)) {
    traversedNonWorkingDates.push(cursor);
    cursor = addDays(cursor, 1);
    if (traversedNonWorkingDates.length > 370) throw new Error("no available working day found within 370 days");
  }

  const includesUpcomingOof = traversedNonWorkingDates.some((date) => oof.has(date));
  return {
    status,
    expectedStart: `${today}T${status === "away" ? "00:00" : workEnd}`,
    expectedEnd: `${cursor}T${workStart}`,
    returnDate: cursor,
    traversedNonWorkingDates,
    includesUpcomingOof,
    messageVariant:
      status === "away"
        ? "away"
        : includesUpcomingOof
          ? "non_working_hours_upcoming_oof"
          : "non_working_hours",
  };
}

function selfTest() {
  const common = {
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    workStart: "09:00",
    workEnd: "18:00",
    holidayDates: [],
  };
  const nextWeekLeave = computePeriod({
    ...common,
    today: "2026-07-17",
    oofDates: [
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-27",
      "2026-07-28",
      "2026-07-29",
      "2026-07-30",
      "2026-07-31",
    ],
  });
  const normalWeekend = computePeriod({ ...common, today: "2026-07-17", oofDates: [] });
  const awayDay = computePeriod({ ...common, today: "2026-07-20", oofDates: ["2026-07-20"] });

  if (
    nextWeekLeave.expectedStart !== "2026-07-17T18:00" ||
    nextWeekLeave.expectedEnd !== "2026-08-03T09:00" ||
    nextWeekLeave.returnDate !== "2026-08-03" ||
    !nextWeekLeave.includesUpcomingOof ||
    nextWeekLeave.messageVariant !== "non_working_hours_upcoming_oof" ||
    normalWeekend.expectedEnd !== "2026-07-20T09:00" ||
    normalWeekend.includesUpcomingOof ||
    awayDay.status !== "away" ||
    awayDay.expectedStart !== "2026-07-20T00:00"
  ) {
    throw new Error("period computation self-test failed");
  }
  console.log("OOF_PERIOD_COMPUTATION_SELF_TEST_OK return=2026-08-03");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args["self-test"]) return selfTest();
  const result = computePeriod({
    today: String(args.today || ""),
    workingDays: parseList(args["working-days"]),
    workStart: String(args["work-start"] || ""),
    workEnd: String(args["work-end"] || ""),
    oofDates: parseList(args["oof-dates"]),
    holidayDates: parseList(args["holiday-dates"]),
  });
  console.log(JSON.stringify(result));
}

if (require.main === module) main();

module.exports = { computePeriod };
