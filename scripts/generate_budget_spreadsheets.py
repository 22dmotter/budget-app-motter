#!/usr/bin/env python3
"""Generate free Budget App .xlsx templates into apps/web/public/downloads/."""

from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles.differential import DifferentialStyle

BRAND = "Budget App"
OUT = Path(__file__).resolve().parents[1] / "apps" / "web" / "public" / "downloads"

NAVY = "0F1E3D"
CRIMSON = "B42318"
SOFT = "FEF3F2"
ALT = "EEF1F6"
WHITE = "FFFFFF"
MUTED = "475569"
LINE = "E2E8F0"

thin = Border(
    left=Side(style="thin", color=LINE),
    right=Side(style="thin", color=LINE),
    top=Side(style="thin", color=LINE),
    bottom=Side(style="thin", color=LINE),
)
header_fill = PatternFill("solid", fgColor=NAVY)
header_font = Font(name="Calibri", bold=True, color=WHITE, size=11)
title_font = Font(name="Calibri", bold=True, color=NAVY, size=16)
section_font = Font(name="Calibri", bold=True, color=NAVY, size=12)
accent_font = Font(name="Calibri", bold=True, color=CRIMSON, size=11)
normal = Font(name="Calibri", size=11, color=NAVY)
muted_font = Font(name="Calibri", size=10, color=MUTED, italic=True)
example_fill = PatternFill("solid", fgColor=SOFT)
alt_fill = PatternFill("solid", fgColor=ALT)
currency = '"$"#,##0.00'
percent = "0.0%"
date_fmt = "YYYY-MM-DD"


def style_header_row(ws, row: int, cols: int):
    for c in range(1, cols + 1):
        cell = ws.cell(row=row, column=c)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin


def set_widths(ws, widths: dict[str, float]):
    for col, w in widths.items():
        ws.column_dimensions[col].width = w


def how_to_sheet(wb: Workbook, title: str, bullets: list[str], verse: str):
    ws = wb.create_sheet("How to use", 0)
    ws["A1"] = f"{BRAND} — {title}"
    ws["A1"].font = title_font
    ws.merge_cells("A1:B1")
    ws["A3"] = "How to use"
    ws["A3"].font = section_font
    r = 4
    for b in bullets:
        ws.cell(row=r, column=1, value=f"• {b}").font = normal
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        r += 1
    r += 1
    ws.cell(row=r, column=1, value="Works in").font = section_font
    r += 1
    ws.cell(
        row=r,
        column=1,
        value="Microsoft Excel, Google Sheets (File → Import), and Apple Numbers.",
    ).font = normal
    r += 2
    ws.cell(row=r, column=1, value="A word on planning").font = section_font
    r += 1
    ws.cell(row=r, column=1, value=verse).font = muted_font
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
    r += 2
    ws.cell(
        row=r,
        column=1,
        value="Not financial advice. Delete any Example rows before using with your own numbers.",
    ).font = muted_font
    set_widths(ws, {"A": 100, "B": 20})
    ws.row_dimensions[1].height = 24


def add_example_label(cell):
    cell.fill = example_fill
    if cell.font and cell.font.bold:
        cell.font = Font(name="Calibri", bold=True, color=CRIMSON, size=11)
    else:
        cell.font = Font(name="Calibri", color=CRIMSON, size=11)


# ---------------------------------------------------------------------------
# 1) Monthly Zero-Based Budget
# ---------------------------------------------------------------------------

def build_monthly_budget(path: Path):
    wb = Workbook()
    # remove default later
    default = wb.active
    wb.remove(default)

    how_to_sheet(
        wb,
        "Monthly Zero-Based Budget",
        [
            "Enter this month's income sources in the Income table (Planned and Actual).",
            "Assign every dollar in the Budget Categories table (Giving/Tithe, Savings, Debt, Needs, Wants).",
            "Watch 'Remaining to assign' — a true zero-based budget aims for $0.00 left.",
            "Yellow/crimson Example rows are samples you can clear or overwrite.",
            "Totals and remaining use live formulas — do not type over the Total rows.",
        ],
        '"The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty." (Proverbs 21:5, ESV)',
    )

    ws = wb.create_sheet("Budget", 1)
    ws["A1"] = f"{BRAND} — Monthly Zero-Based Budget"
    ws["A1"].font = title_font
    ws.merge_cells("A1:F1")
    ws["A2"] = "Month / Year:"
    ws["A2"].font = normal
    ws["B2"] = "Example — January 2026"
    add_example_label(ws["B2"])

    # Income
    ws["A4"] = "Income"
    ws["A4"].font = section_font
    headers = ["Source", "Planned", "Actual", "Difference"]
    for i, h in enumerate(headers, 1):
        ws.cell(row=5, column=i, value=h)
    style_header_row(ws, 5, 4)

    # Example income rows 6-7, blank 8-12
    income_examples = [
        ("Example — Primary paycheck", 3200, 3200),
        ("Example — Side income", 200, None),
    ]
    for i, (name, planned, actual) in enumerate(income_examples):
        row = 6 + i
        ws.cell(row=row, column=1, value=name)
        add_example_label(ws.cell(row=row, column=1))
        ws.cell(row=row, column=2, value=planned).number_format = currency
        if actual is not None:
            ws.cell(row=row, column=3, value=actual).number_format = currency
        else:
            ws.cell(row=row, column=3).number_format = currency
        ws.cell(row=row, column=4, value=f"=IF(OR(B{row}=\"\",C{row}=\"\"),\"\",C{row}-B{row})")
        ws.cell(row=row, column=4).number_format = currency
        for c in range(1, 5):
            ws.cell(row=row, column=c).border = thin
            if c > 1:
                ws.cell(row=row, column=c).fill = example_fill

    for row in range(8, 13):
        ws.cell(row=row, column=1, value="")
        ws.cell(row=row, column=2).number_format = currency
        ws.cell(row=row, column=3).number_format = currency
        ws.cell(row=row, column=4, value=f"=IF(OR(B{row}=\"\",AND(C{row}=\"\",B{row}=\"\")),\"\",IF(C{row}=\"\",0-B{row},C{row}-B{row}))")
        # Simpler difference formula
        ws.cell(row=row, column=4, value=f"=IF(B{row}=\"\",\"\",IF(C{row}=\"\",\"\",C{row}-B{row}))")
        ws.cell(row=row, column=4).number_format = currency
        for c in range(1, 5):
            ws.cell(row=row, column=c).border = thin

    # Fix example row formulas cleanly
    for row in range(6, 8):
        ws.cell(row=row, column=4, value=f"=IF(B{row}=\"\",\"\",IF(C{row}=\"\",\"\",C{row}-B{row}))")
        ws.cell(row=row, column=4).number_format = currency

    ws["A13"] = "Total Income"
    ws["A13"].font = accent_font
    ws["B13"] = "=SUM(B6:B12)"
    ws["C13"] = "=SUM(C6:C12)"
    ws["D13"] = "=IF(B13=\"\",\"\",C13-B13)"
    for c in range(1, 5):
        ws.cell(row=13, column=c).font = accent_font
        ws.cell(row=13, column=c).border = thin
        ws.cell(row=13, column=c).fill = alt_fill
    ws["B13"].number_format = currency
    ws["C13"].number_format = currency
    ws["D13"].number_format = currency

    # Categories
    ws["A15"] = "Budget Categories"
    ws["A15"].font = section_font
    cat_headers = ["Category", "Type", "Planned", "Actual", "Remaining", "Notes"]
    for i, h in enumerate(cat_headers, 1):
        ws.cell(row=16, column=i, value=h)
    style_header_row(ws, 16, 6)

    categories = [
        ("Example — Tithe / Giving", "Giving/Tithe", 340, 340),
        ("Example — Emergency fund", "Savings", 200, 200),
        ("Example — Credit card payment", "Debt payments", 250, 250),
        ("Example — Rent / housing", "Needs", 1200, 1200),
        ("Example — Groceries", "Needs", 450, 420),
        ("Example — Utilities", "Needs", 180, None),
        ("Example — Dining out", "Wants", 120, 95),
        ("Example — Entertainment", "Wants", 60, None),
    ]
    start = 17
    for i, (name, typ, planned, actual) in enumerate(categories):
        row = start + i
        ws.cell(row=row, column=1, value=name)
        add_example_label(ws.cell(row=row, column=1))
        ws.cell(row=row, column=2, value=typ)
        ws.cell(row=row, column=2).fill = example_fill
        ws.cell(row=row, column=3, value=planned).number_format = currency
        ws.cell(row=row, column=3).fill = example_fill
        if actual is not None:
            ws.cell(row=row, column=4, value=actual).number_format = currency
        else:
            ws.cell(row=row, column=4).number_format = currency
        ws.cell(row=row, column=4).fill = example_fill
        ws.cell(row=row, column=5, value=f"=IF(C{row}=\"\",\"\",C{row}-IF(D{row}=\"\",0,D{row}))")
        ws.cell(row=row, column=5).number_format = currency
        ws.cell(row=row, column=5).fill = example_fill
        ws.cell(row=row, column=6, value="Example — delete or overwrite")
        ws.cell(row=row, column=6).font = muted_font
        ws.cell(row=row, column=6).fill = example_fill
        for c in range(1, 7):
            ws.cell(row=row, column=c).border = thin

    # Blank category rows
    for row in range(start + len(categories), start + len(categories) + 10):
        for c in range(1, 7):
            ws.cell(row=row, column=c).border = thin
        ws.cell(row=row, column=3).number_format = currency
        ws.cell(row=row, column=4).number_format = currency
        ws.cell(row=row, column=5, value=f"=IF(C{row}=\"\",\"\",C{row}-IF(D{row}=\"\",0,D{row}))")
        ws.cell(row=row, column=5).number_format = currency

    last_cat = start + len(categories) + 9
    total_row = last_cat + 1
    ws.cell(row=total_row, column=1, value="Total Expenses").font = accent_font
    ws.cell(row=total_row, column=3, value=f"=SUM(C{start}:C{last_cat})")
    ws.cell(row=total_row, column=4, value=f"=SUM(D{start}:D{last_cat})")
    ws.cell(row=total_row, column=5, value=f"=C{total_row}-D{total_row}")
    for c in range(1, 7):
        ws.cell(row=total_row, column=c).border = thin
        ws.cell(row=total_row, column=c).fill = alt_fill
        ws.cell(row=total_row, column=c).font = accent_font
    ws.cell(row=total_row, column=3).number_format = currency
    ws.cell(row=total_row, column=4).number_format = currency
    ws.cell(row=total_row, column=5).number_format = currency

    # Zero-based check
    check = total_row + 2
    ws.cell(row=check, column=1, value="Remaining to assign (aim for $0.00)").font = section_font
    ws.cell(row=check, column=3, value=f"=B13-C{total_row}")
    ws.cell(row=check, column=3).number_format = currency
    ws.cell(row=check, column=3).font = accent_font
    ws.cell(row=check, column=4, value='=IF(ABS(C{0})<0.005,"Zero-based ✓","Assign remaining income")'.format(check))
    ws.cell(row=check, column=4).font = accent_font

    ws.cell(row=check + 2, column=1, value="Type guide: Giving/Tithe · Savings · Debt payments · Needs · Wants").font = muted_font

    # Data validation for Type column
    dv = DataValidation(
        type="list",
        formula1='"Giving/Tithe,Savings,Debt payments,Needs,Wants"',
        allow_blank=True,
    )
    dv.error = "Choose a category type"
    dv.errorTitle = "Invalid type"
    ws.add_data_validation(dv)
    dv.add(f"B{start}:B{last_cat}")

    ws.freeze_panes = "A17"
    set_widths(ws, {"A": 34, "B": 16, "C": 12, "D": 12, "E": 12, "F": 28})
    wb.save(path)


# ---------------------------------------------------------------------------
# 2) Debt Snowball Tracker
# ---------------------------------------------------------------------------

def build_debt_snowball(path: Path):
    wb = Workbook()
    default = wb.active
    wb.remove(default)

    how_to_sheet(
        wb,
        "Debt Snowball Tracker",
        [
            "List each debt on the Debts sheet: balance, APR, and minimum payment.",
            "Enter your Extra monthly payment (beyond all minimums) in the yellow cell.",
            "Sort visually by smallest balance first (snowball order). Example rows show the idea.",
            "The Schedule sheet projects up to 60 months with interest and payments using formulas.",
            "When Debt 1 hits $0, its payment rolls into Debt 2 automatically (snowball).",
            "Summary cells show estimated total interest and the first debt-free month number.",
        ],
        '"For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?" (Luke 14:28, ESV)',
    )

    debts = wb.create_sheet("Debts", 1)
    debts["A1"] = f"{BRAND} — Debt Snowball Tracker"
    debts["A1"].font = title_font
    debts.merge_cells("A1:G1")

    debts["A3"] = "Extra monthly payment (beyond minimums)"
    debts["A3"].font = section_font
    debts["C3"] = 150  # example
    debts["C3"].number_format = currency
    add_example_label(debts["C3"])
    debts["D3"] = "Example — change to your amount"
    debts["D3"].font = muted_font

    headers = [
        "Debt name",
        "Balance",
        "APR %",
        "Min payment",
        "Snowball order",
        "Monthly rate",
        "Notes",
    ]
    for i, h in enumerate(headers, 1):
        debts.cell(row=5, column=i, value=h)
    style_header_row(debts, 5, 7)

    examples = [
        ("Example — Store card", 450, 22.9, 35, 1),
        ("Example — Auto loan", 4200, 6.5, 185, 2),
        ("Example — Student loan", 8900, 5.0, 95, 3),
    ]
    for i, (name, bal, apr, mn, order) in enumerate(examples):
        row = 6 + i
        debts.cell(row=row, column=1, value=name)
        add_example_label(debts.cell(row=row, column=1))
        debts.cell(row=row, column=2, value=bal).number_format = currency
        debts.cell(row=row, column=3, value=apr).number_format = "0.00"
        debts.cell(row=row, column=4, value=mn).number_format = currency
        debts.cell(row=row, column=5, value=order)
        debts.cell(row=row, column=6, value=f"=IF(C{row}=\"\",\"\",C{row}/100/12)")
        debts.cell(row=row, column=6).number_format = "0.0000%"
        debts.cell(row=row, column=7, value="Example — delete or overwrite")
        debts.cell(row=row, column=7).font = muted_font
        for c in range(1, 8):
            debts.cell(row=row, column=c).border = thin
            debts.cell(row=row, column=c).fill = example_fill

    for row in range(9, 14):
        for c in range(1, 8):
            debts.cell(row=row, column=c).border = thin
        debts.cell(row=row, column=2).number_format = currency
        debts.cell(row=row, column=3).number_format = "0.00"
        debts.cell(row=row, column=4).number_format = currency
        debts.cell(row=row, column=6, value=f"=IF(C{row}=\"\",\"\",C{row}/100/12)")
        debts.cell(row=row, column=6).number_format = "0.0000%"

    debts["A15"] = "Total balances"
    debts["B15"] = "=SUM(B6:B13)"
    debts["B15"].number_format = currency
    debts["A16"] = "Total minimums"
    debts["B16"] = "=SUM(D6:D13)"
    debts["B16"].number_format = currency
    debts["A15"].font = accent_font
    debts["A16"].font = accent_font
    debts["B15"].font = accent_font
    debts["B16"].font = accent_font

    debts["A18"] = "Tip: put the smallest balance in row 6 (Order 1), next smallest in row 7, etc."
    debts["A18"].font = muted_font

    debts.freeze_panes = "A6"
    set_widths(debts, {"A": 28, "B": 12, "C": 10, "D": 14, "E": 14, "F": 12, "G": 28})

    # Schedule — 3 debts (rows 6-8) for clarity with snowball cascade
    sch = wb.create_sheet("Schedule", 2)
    sch["A1"] = "Month-by-month snowball schedule (up to 60 months)"
    sch["A1"].font = title_font
    sch.merge_cells("A1:N1")
    sch["A2"] = "Balances, interest, and payments are formula-driven from the Debts sheet. Extra payment (Debts!C3) applies to the lowest-order debt still owing."
    sch["A2"].font = muted_font
    sch.merge_cells("A2:N2")

    # Headers
    # A: Month
    # For debt 1 (D1): Start, Interest, Payment, End
    # Same for D2, D3
    # Then Total Interest MTD, Cumulative Interest
    hdr = [
        "Month",
        "D1 Start",
        "D1 Interest",
        "D1 Payment",
        "D1 End",
        "D2 Start",
        "D2 Interest",
        "D2 Payment",
        "D2 End",
        "D3 Start",
        "D3 Interest",
        "D3 Payment",
        "D3 End",
        "Month interest",
        "Cumulative interest",
    ]
    for i, h in enumerate(hdr, 1):
        sch.cell(row=4, column=i, value=h)
    style_header_row(sch, 4, len(hdr))

    # Month 1
    # D1 start = Debts!B6
    # Interest = Start * monthly rate
    # Payment snowball logic:
    #   mins for all active debts + extra on first active
    # For month 1:
    # D1 payment = MIN(D1Start+D1Int, D1Min + Extra + (0 if others still need mins - actually classic snowball:
    #   Pay all minimums; put extra on smallest (D1).
    #   Payment_D1 = MIN(balance+interest, min_D1 + extra)
    #   Payment_D2 = MIN(balance+interest, min_D2) if balance > 0
    # When D1 paid off, Payment_D2 = MIN(..., min_D2 + extra + min_D1)

    # Using IF for paid-off detection via End balance of previous month.

    def write_month(row: int, month: int):
        sch.cell(row=row, column=1, value=month)
        if month == 1:
            # Starts
            sch.cell(row=row, column=2, value="=IF(Debts!B6=\"\",0,Debts!B6)")  # D1 start
            sch.cell(row=row, column=6, value="=IF(Debts!B7=\"\",0,Debts!B7)")  # D2
            sch.cell(row=row, column=10, value="=IF(Debts!B8=\"\",0,Debts!B8)")  # D3
        else:
            prev = row - 1
            sch.cell(row=row, column=2, value=f"=E{prev}")
            sch.cell(row=row, column=6, value=f"=I{prev}")
            sch.cell(row=row, column=10, value=f"=M{prev}")

        # Interest
        sch.cell(row=row, column=3, value=f"=IF(B{row}<=0,0,B{row}*IF(Debts!F6=\"\",0,Debts!F6))")
        sch.cell(row=row, column=7, value=f"=IF(F{row}<=0,0,F{row}*IF(Debts!F7=\"\",0,Debts!F7))")
        sch.cell(row=row, column=11, value=f"=IF(J{row}<=0,0,J{row}*IF(Debts!F8=\"\",0,Debts!F8))")

        # Payments with snowball
        # Available extra = Debts!$C$3
        # D1 pay = if B>0: MIN(B+C, Debts!D6 + Debts!$C$3) else 0
        # D2 pay = if F>0: MIN(F+G, Debts!D7 + IF(B{row}<=0, Debts!D6+Debts!$C$3, 0)) else 0
        #   Wait - when D1 still active, D2 only gets min. When D1 done, D2 gets min+extra+D1min
        # D3 similar: min + IF both D1 and D2 done, then D1min+D2min+extra

        sch.cell(
            row=row,
            column=4,
            value=(
                f'=IF(B{row}<=0,0,MIN(B{row}+C{row},IF(Debts!D6="",0,Debts!D6)+IF(Debts!$C$3="",0,Debts!$C$3)))'
            ),
        )
        sch.cell(
            row=row,
            column=8,
            value=(
                f'=IF(F{row}<=0,0,MIN(F{row}+G{row},IF(Debts!D7="",0,Debts!D7)'
                f'+IF(B{row}<=0,IF(Debts!D6="",0,Debts!D6)+IF(Debts!$C$3="",0,Debts!$C$3),0)))'
            ),
        )
        sch.cell(
            row=row,
            column=12,
            value=(
                f'=IF(J{row}<=0,0,MIN(J{row}+K{row},IF(Debts!D8="",0,Debts!D8)'
                f'+IF(AND(B{row}<=0,F{row}<=0),IF(Debts!D6="",0,Debts!D6)+IF(Debts!D7="",0,Debts!D7)+IF(Debts!$C$3="",0,Debts!$C$3),0)))'
            ),
        )

        # End balances
        sch.cell(row=row, column=5, value=f"=MAX(0,B{row}+C{row}-D{row})")
        sch.cell(row=row, column=9, value=f"=MAX(0,F{row}+G{row}-H{row})")
        sch.cell(row=row, column=13, value=f"=MAX(0,J{row}+K{row}-L{row})")

        # Month interest & cumulative
        sch.cell(row=row, column=14, value=f"=C{row}+G{row}+K{row}")
        if month == 1:
            sch.cell(row=row, column=15, value=f"=N{row}")
        else:
            sch.cell(row=row, column=15, value=f"=O{row-1}+N{row}")

        for c in range(2, 16):
            sch.cell(row=row, column=c).number_format = currency
            sch.cell(row=row, column=c).border = thin
        sch.cell(row=row, column=1).border = thin

    for m in range(1, 61):
        write_month(4 + m, m)

    # Helper column: all debts clear this month?
    sch.cell(row=4, column=16, value="All clear?")
    style_header_row(sch, 4, 16)
    # restyle only P header without wiping others — style_header_row redid A-P; re-apply A-O headers
    for i, h in enumerate(hdr, 1):
        sch.cell(row=4, column=i, value=h)
    style_header_row(sch, 4, 16)
    for m in range(1, 61):
        row = 4 + m
        sch.cell(
            row=row,
            column=16,
            value=f"=IF(AND(E{row}<=0.005,I{row}<=0.005,M{row}<=0.005),1,0)",
        )
        sch.cell(row=row, column=16).border = thin
    sch.column_dimensions["P"].width = 12

    # Summary (month 60 lives on row 64)
    sch["A66"] = "Summary"
    sch["A66"].font = section_font
    sch["A67"] = "Estimated total interest (60-mo window)"
    sch["C67"] = "=O64"
    sch["C67"].number_format = currency
    sch["C67"].font = accent_font
    sch["A68"] = "Debt-free month number (first month all End balances are $0)"
    sch["C68"] = (
        '=IFERROR(MATCH(1,P5:P64,0),"Still owing after 60 months — raise the extra payment")'
    )
    sch["C68"].font = accent_font
    sch["A69"] = "Note: Schedule models the first three debt rows (Debts!6:8). Keep snowball order as smallest balance in row 6."
    sch["A69"].font = muted_font

    sch.freeze_panes = "B5"
    for col in range(1, 16):
        sch.column_dimensions[get_column_letter(col)].width = 12
    sch.column_dimensions["A"].width = 10

    wb.save(path)


# ---------------------------------------------------------------------------
# 3) Expense Tracker
# ---------------------------------------------------------------------------

def build_expense_tracker(path: Path):
    wb = Workbook()
    default = wb.active
    wb.remove(default)

    how_to_sheet(
        wb,
        "Expense Tracker",
        [
            "Log each purchase on the Transactions sheet (date, description, category, amount).",
            "Categories are chosen from a dropdown (edit the list on the Categories sheet).",
            "The Summary sheet totals spending by category with SUMIFS — update the Month filter cell.",
            "Example rows are tinted; clear them before tracking your real expenses.",
        ],
        '"The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty." (Proverbs 21:5, ESV)',
    )

    cats = wb.create_sheet("Categories", 1)
    cats["A1"] = "Category list (used by the dropdown)"
    cats["A1"].font = section_font
    cat_list = [
        "Giving/Tithe",
        "Housing",
        "Utilities",
        "Groceries",
        "Transport",
        "Debt payments",
        "Savings",
        "Dining",
        "Health",
        "Personal",
        "Entertainment",
        "Other",
    ]
    cats["A2"] = "Category"
    style_header_row(cats, 2, 1)
    for i, c in enumerate(cat_list):
        cats.cell(row=3 + i, column=1, value=c).border = thin
    set_widths(cats, {"A": 22})

    tx = wb.create_sheet("Transactions", 2)
    tx["A1"] = f"{BRAND} — Expense Tracker"
    tx["A1"].font = title_font
    tx.merge_cells("A1:E1")
    headers = ["Date", "Description", "Category", "Amount", "Notes"]
    for i, h in enumerate(headers, 1):
        tx.cell(row=3, column=i, value=h)
    style_header_row(tx, 3, 5)

    examples = [
        ("2026-01-03", "Example — Grocery run", "Groceries", 86.42),
        ("2026-01-05", "Example — Gas", "Transport", 40.00),
        ("2026-01-08", "Example — Tithe", "Giving/Tithe", 200.00),
        ("2026-01-10", "Example — Coffee", "Dining", 5.75),
    ]
    for i, (dt, desc, cat, amt) in enumerate(examples):
        row = 4 + i
        tx.cell(row=row, column=1, value=dt)
        # store as date-like string; user can replace — or use datetime
        from datetime import datetime

        tx.cell(row=row, column=1, value=datetime.strptime(dt, "%Y-%m-%d"))
        tx.cell(row=row, column=1).number_format = date_fmt
        tx.cell(row=row, column=2, value=desc)
        add_example_label(tx.cell(row=row, column=2))
        tx.cell(row=row, column=3, value=cat)
        tx.cell(row=row, column=4, value=amt).number_format = currency
        tx.cell(row=row, column=5, value="Example — delete or overwrite").font = muted_font
        for c in range(1, 6):
            tx.cell(row=row, column=c).border = thin
            tx.cell(row=row, column=c).fill = example_fill

    for row in range(8, 208):
        for c in range(1, 6):
            tx.cell(row=row, column=c).border = thin
        tx.cell(row=row, column=1).number_format = date_fmt
        tx.cell(row=row, column=4).number_format = currency

    dv = DataValidation(
        type="list",
        formula1="=Categories!$A$3:$A$14",
        allow_blank=True,
    )
    tx.add_data_validation(dv)
    dv.add("C4:C207")

    tx["A209"] = "Total (all rows)"
    tx["A209"].font = accent_font
    tx["D209"] = "=SUM(D4:D207)"
    tx["D209"].number_format = currency
    tx["D209"].font = accent_font

    tx.freeze_panes = "A4"
    set_widths(tx, {"A": 12, "B": 36, "C": 16, "D": 12, "E": 28})

    summary = wb.create_sheet("Summary", 3)
    summary["A1"] = "Monthly summary by category"
    summary["A1"].font = title_font
    summary["A3"] = "Summary month (1-12)"
    summary["B3"] = 1  # January example
    add_example_label(summary["B3"])
    summary["C3"] = "Example — set to the month number you want to review"
    summary["C3"].font = muted_font
    summary["A4"] = "Summary year"
    summary["B4"] = 2026
    add_example_label(summary["B4"])

    summary["A6"] = "Category"
    summary["B6"] = "Total"
    style_header_row(summary, 6, 2)

    for i, cname in enumerate(cat_list):
        row = 7 + i
        summary.cell(row=row, column=1, value=cname).border = thin
        # SUMIFS with month/year on date
        summary.cell(
            row=row,
            column=2,
            value=(
                f'=SUMIFS(Transactions!$D$4:$D$207,Transactions!$C$4:$C$207,A{row},'
                f'Transactions!$A$4:$A$207,">="&DATE($B$4,$B$3,1),'
                f'Transactions!$A$4:$A$207,"<"&DATE($B$4,$B$3+1,1))'
            ),
        )
        # DATE with month 12+1 can be issue — use safer EOMONTH style:
        # For month 12, DATE(y,13,1) works in Excel (rolls to next year). Good.
        summary.cell(row=row, column=2).number_format = currency
        summary.cell(row=row, column=2).border = thin

    last = 6 + len(cat_list)
    summary.cell(row=last + 1, column=1, value="Grand total").font = accent_font
    summary.cell(row=last + 1, column=2, value=f"=SUM(B7:B{last})")
    summary.cell(row=last + 1, column=2).number_format = currency
    summary.cell(row=last + 1, column=2).font = accent_font

    set_widths(summary, {"A": 18, "B": 14, "C": 48})
    wb.save(path)


# ---------------------------------------------------------------------------
# 4) Savings Goals / Sinking Funds
# ---------------------------------------------------------------------------

def build_savings_goals(path: Path):
    wb = Workbook()
    default = wb.active
    wb.remove(default)

    how_to_sheet(
        wb,
        "Savings Goals / Sinking Funds",
        [
            "List each goal with a target amount, amount already saved, and target date.",
            "Remaining and % progress calculate automatically.",
            "Monthly amount needed divides Remaining by months until the target date (blank if overdue or complete).",
            "Progress column uses a data bar — helpful in Excel and compatible apps that support it.",
            "Example rows are tinted; replace them with your sinking funds (car repairs, Christmas, insurance, etc.).",
        ],
        '"For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?" (Luke 14:28, ESV)',
    )

    ws = wb.create_sheet("Goals", 1)
    ws["A1"] = f"{BRAND} — Savings Goals / Sinking Funds"
    ws["A1"].font = title_font
    ws.merge_cells("A1:H1")
    ws["A2"] = "Today's date (used for monthly needed)"
    ws["B2"] = "=TODAY()"
    ws["B2"].number_format = date_fmt
    ws["B2"].font = accent_font

    headers = [
        "Goal",
        "Target amount",
        "Saved so far",
        "Remaining",
        "% Progress",
        "Target date",
        "Monthly needed",
        "Notes",
    ]
    for i, h in enumerate(headers, 1):
        ws.cell(row=4, column=i, value=h)
    style_header_row(ws, 4, 8)

    from datetime import datetime

    examples = [
        ("Example — Emergency fund", 3000, 750, datetime(2026, 12, 31)),
        ("Example — Car repairs", 800, 200, datetime(2026, 6, 30)),
        ("Example — Christmas giving", 500, 50, datetime(2026, 12, 1)),
    ]
    for i, (name, target, saved, tdate) in enumerate(examples):
        row = 5 + i
        ws.cell(row=row, column=1, value=name)
        add_example_label(ws.cell(row=row, column=1))
        ws.cell(row=row, column=2, value=target).number_format = currency
        ws.cell(row=row, column=3, value=saved).number_format = currency
        ws.cell(row=row, column=4, value=f"=IF(B{row}=\"\",\"\",MAX(0,B{row}-IF(C{row}=\"\",0,C{row})))")
        ws.cell(row=row, column=4).number_format = currency
        ws.cell(
            row=row,
            column=5,
            value=f'=IF(OR(B{row}="",B{row}=0),"",IF(C{row}="",0,MIN(1,C{row}/B{row})))',
        )
        ws.cell(row=row, column=5).number_format = percent
        ws.cell(row=row, column=6, value=tdate).number_format = date_fmt
        ws.cell(
            row=row,
            column=7,
            value=(
                f'=IF(OR(B{row}="",F{row}=""),"",'
                f'IF(D{row}<=0,0,'
                f'IF(F{row}<=$B$2,"",'
                f'D{row}/MAX(1,((YEAR(F{row})-YEAR($B$2))*12+MONTH(F{row})-MONTH($B$2))))))'
            ),
        )
        ws.cell(row=row, column=7).number_format = currency
        ws.cell(row=row, column=8, value="Example — delete or overwrite").font = muted_font
        for c in range(1, 9):
            ws.cell(row=row, column=c).border = thin
            ws.cell(row=row, column=c).fill = example_fill

    for row in range(8, 28):
        for c in range(1, 9):
            ws.cell(row=row, column=c).border = thin
        ws.cell(row=row, column=2).number_format = currency
        ws.cell(row=row, column=3).number_format = currency
        ws.cell(row=row, column=4, value=f"=IF(B{row}=\"\",\"\",MAX(0,B{row}-IF(C{row}=\"\",0,C{row})))")
        ws.cell(row=row, column=4).number_format = currency
        ws.cell(
            row=row,
            column=5,
            value=f'=IF(OR(B{row}="",B{row}=0),"",IF(C{row}="",0,MIN(1,C{row}/B{row})))',
        )
        ws.cell(row=row, column=5).number_format = percent
        ws.cell(row=row, column=6).number_format = date_fmt
        ws.cell(
            row=row,
            column=7,
            value=(
                f'=IF(OR(B{row}="",F{row}=""),"",'
                f'IF(D{row}<=0,0,'
                f'IF(F{row}<=$B$2,"",'
                f'D{row}/MAX(1,((YEAR(F{row})-YEAR($B$2))*12+MONTH(F{row})-MONTH($B$2))))))'
            ),
        )
        ws.cell(row=row, column=7).number_format = currency

    # Data bars on progress
    rule = DataBarRule(
        start_type="num",
        start_value=0,
        end_type="num",
        end_value=1,
        color=CRIMSON,
        showValue=True,
        minLength=None,
        maxLength=None,
    )
    ws.conditional_formatting.add("E5:E27", rule)

    ws["A29"] = "Totals"
    ws["A29"].font = accent_font
    ws["B29"] = "=SUM(B5:B27)"
    ws["C29"] = "=SUM(C5:C27)"
    ws["D29"] = "=SUM(D5:D27)"
    for col in ("B", "C", "D"):
        ws[f"{col}29"].number_format = currency
        ws[f"{col}29"].font = accent_font

    ws.freeze_panes = "A5"
    set_widths(
        ws,
        {
            "A": 28,
            "B": 14,
            "C": 14,
            "D": 12,
            "E": 12,
            "F": 13,
            "G": 15,
            "H": 28,
        },
    )
    wb.save(path)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = {
        "budget-app-monthly-budget.xlsx": build_monthly_budget,
        "budget-app-debt-snowball.xlsx": build_debt_snowball,
        "budget-app-expense-tracker.xlsx": build_expense_tracker,
        "budget-app-savings-goals.xlsx": build_savings_goals,
    }
    for name, fn in files.items():
        path = OUT / name
        fn(path)
        print(f"wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
