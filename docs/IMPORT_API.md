# Lilith Homes Import API

Updated: 2026-08-28

## Purpose

`/api/import` receives qualified real estate leads from partner agents, Excel exports, or external CRM tools. It supports:

- JSON: `application/json`
- CSV copied/exported from Excel: `text/csv`
- File upload from dashboard: `multipart/form-data` with `file`

The public lead form still posts to `/api/leads`. The import API is for trusted operators and partner integrations only.

## Security

Import requires one of these:

- ChatGPT authenticated dashboard session
- Header `x-lilith-import-token: <token>`
- Header `Authorization: Bearer <token>`

Set the hosted secret as `LEAD_IMPORT_TOKEN` before giving the endpoint to external partners. Do not put the token inside CSV files, URLs, or screenshots.

## Endpoint

```http
POST /api/import
Content-Type: application/json
x-lilith-import-token: <LEAD_IMPORT_TOKEN>
```

JSON example:

```json
{
  "leads": [
    {
      "name": "Ms. Li",
      "contact": "li@example.cn",
      "wechat": "li-bkk-home",
      "budget": 120000,
      "budgetPeriod": "Monthly rent",
      "dealIntent": "Rent 12-month",
      "customerCountry": "China",
      "preferredLanguage": "中文 / English",
      "area": "Phrom Phong",
      "propertyType": "Condo",
      "bedrooms": 2,
      "moveDate": "2026-10-01",
      "requirements": "Near BTS, quiet building, invoice support",
      "partnerAgency": "Shanghai Relocation Desk",
      "partnerAgent": "Agent Chen",
      "partnerContact": "chen-wechat",
      "externalId": "CN-001"
    }
  ]
}
```

CSV headers for Excel:

```csv
name,contact,wechat,budget,budgetPeriod,dealIntent,customerCountry,preferredLanguage,area,propertyType,bedrooms,moveDate,requirements,partnerAgency,partnerAgent,partnerContact,externalId
Ms. Li,li@example.cn,li-bkk-home,120000,Monthly rent,Rent 12-month,China,中文 / English,Phrom Phong,Condo,2,2026-10-01,Near BTS and invoice support,Shanghai Relocation Desk,Agent Chen,chen-wechat,CN-001
```

## Required Fields

- `name`
- `contact` or `wechat` or `partnerContact`
- `budget`
- `budgetPeriod`: `Monthly rent`, `Purchase budget`, or `Listing value`
- `dealIntent`: `Rent 12-month`, `Buy condo`, `Sell/List property`, or `China agent referral`
- `customerCountry`
- `preferredLanguage`
- `area`
- `propertyType`

## Validation Rules

- Monthly rental leads require `contractTerm` = `12 months` and budget from THB 30,000 to THB 250,000.
- Purchase leads require budget from THB 1,000,000 to THB 250,000,000.
- Listing leads require value from THB 1,000,000 to THB 500,000,000.
- One request can include up to 500 rows.
- Rejected rows are returned with row number and reason; accepted rows are saved with an `IMPORT-...` batch id.

## Chinese Partner Notes

Recommended minimum partner workflow:

1. Confirm the customer gave permission to share contact details.
2. Ask for WeChat, target city/area, rent or purchase budget, property type, bedrooms, timeline, and required language.
3. Export CSV from Excel with the headers above.
4. Import through the dashboard or API token.
5. Follow up inside the dashboard and keep all fee-split or referral terms outside the customer note.
