# Shared study receiver

Set the script property `SPREADSHEET_ID` to the existing private study spreadsheet. The receiver routes whitelisted study identifiers to fixed tab names:

| Study | Trials | Sessions | Responses | Method map |
|---|---:|---|---|---|
| act-h3-v1 | 30 | Sessions | Responses | MethodMap |
| act-evolution-polished-v1 | 22 | Evolution_Sessions | Evolution_Responses | Evolution_MethodMap |

Run `setupEvolutionStudy` to create the new tabs. This leaves the original tabs unchanged. Import the private candidate mapping into `Evolution_MethodMap`; never publish it in this repository.

Update the existing web app deployment to a new version while retaining its URL and access settings. Set the GitHub Actions variable `VITE_APPS_SCRIPT_URL` to that `/exec` URL.

`doGet` reports supported study versions. Submissions validate the study-specific trial range and anonymous choices, escape formula-like strings, use a write lock, and upsert retries. A session is marked complete only after all trials for its study have three answers.
