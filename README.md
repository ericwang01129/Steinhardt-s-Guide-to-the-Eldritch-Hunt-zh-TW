# Steinhardt's Guide to the Eldritch Hunt — zh-TW Integrated

施坦哈德的異界狩獵指南（無異端章節）繁體中文整合版 Foundry VTT 模組。

把 MonkeyDM 的原模組（無異端章節版本）與 Babele 繁體中文翻譯整合成一個**自包**的 Foundry 模組，免去原本「裝原模組 + 裝 babele + 自己丟翻譯檔到 5e-complete」的多步驟流程。

## 整合來源

| 層 | 來源 |
|---|---|
| 原始模組（packs / mjs / css / static） | `segh-monkeydm-without-heretic` (`sgeh-monkeydm-eric`，MonkeyDM, badgerwerks, InYourLibrary) |
| Babele 繁體中文翻譯（sgeh-items pack） | `5e-complete/compendium/sgeh-monkeydm.sgeh-items.json` |
| 整合與 zh-TW UI 譯文 | Eric (ericwang01129) |

## 必要相依

| 模組 | 用途 |
|---|---|
| `dnd5e` system (3.1.0–3.3.0) | 本模組仰賴的核心系統 |
| [`babele`](https://github.com/cs96and/foundryvtt-babele) | 翻譯 runtime；讀取本模組 `compendium/` 目錄下的翻譯表 |
| [`foundry_zh-tw`](https://github.com/hktrpg/foundry_zh-tw) | Foundry 核心 zh-TW 語系，使 Babele 在 `lang='zh-tw'` 時觸發翻譯 |

## 安裝

在 Foundry VTT 的「**附加模組 → 安裝模組 → Manifest URL**」貼上：

```
https://raw.githubusercontent.com/ericwang01129/Steinhardt-s-Guide-to-the-Eldritch-Hunt-zh-TW/main/module.json
```

Foundry 會自動下載本 repo 的 `main` 分支壓縮檔（透過 module.json 內的 `download` 欄位指向 GitHub 自動產生的 tarball）。

啟用前請先把上方三個相依模組裝好。

## 翻譯涵蓋

| Pack | 條目數 | 翻譯狀態 |
|---|---|---|
| `sgeh-items` | 610 | 部份已譯（依 5e-complete 既有翻譯，未譯條目維持英文） |
| `sgeh-tables` | 49 | 翻譯模板（entries 為空，可後續補上） |
| `sgeh-stories` | 5 | 翻譯模板 |
| `sgeh-notes` | 3 | 翻譯模板 |
| `sgeh-foes` | 59 | 翻譯模板 |

UI 字串（lang/zh-tw.json）已依台灣 TRPG 圈 D&D 5e 翻譯慣例完整翻譯。

要補上其他 packs 的翻譯，編輯 [`compendium/`](compendium/) 內對應的 JSON 檔的 `entries` 區塊即可：

```json
{
  "label": "Steinhardt's Tables",
  "entries": {
    "Long-Term Madness": {
      "name": "長期瘋狂",
      "description": "<p>……</p>"
    }
  }
}
```

## 與原模組的差異

本模組為了讓 packs 內所有跨 pack UUID 連結、資產 URL、自訂表單註冊都能解析到自家，已把原模組內所有 `sgeh-monkeydm` / `sgeh-monkeydm-eric` 引用全面改寫為新模組 id，共 **2793 處**：

- `Compendium.sgeh-monkeydm.<pack>.X` → `Compendium.<new-id>.<pack>.X`（1596 處）
- `modules/sgeh-monkeydm/static/...` → `modules/<new-id>/static/...`（286 處）
- HTML class `sgeh-monkeydm doc-description` → `<new-id> doc-description`
- Item type `sgeh-monkeydm.trickwep` → `<new-id>.trickwep`（48 處）
- sheetClass `sgeh-monkeydm.{BeckonTable, LunarTable, SGEHJournal}` → 同
- 殘留 0 處（環迴解包再驗證）

CSS class selector 與 mjs 輸出的 HTML class 也已統一到新 id（原模組這層在 fork 過程中對不上，本模組順手修好）。

## 已知限制

- **未涵蓋的 packs**：sgeh-tables / sgeh-stories / sgeh-notes / sgeh-foes 目前是空翻譯模板，需要逐條補譯。
- **lang/zh-tw.json typo 沿用**：`SGEH.sheet.lunar.name` 原英文為 `"Eldritch Mar Method)"`（缺字 + 括號不對稱），中譯依語意推測為「異界之月（標記法）」。
- **Foundry 版本**：相容性聲明為 v11.315；尚未在 v12+ 測試。

## 版權與授權

- 遊戲機制部分以 OGL 1.0a 授權（見 [LICENSE](LICENSE)）。
- 原模組來源：[MonkeyDM Patreon](https://www.patreon.com/monkeydm)、[trioderegion/sgeh-monkeydm-eric](https://github.com/trioderegion/sgeh-monkeydm-eric)。
- 美術資產 / Product Identity 之版權屬於原作者（MonkeyDM 等）。本 repo 僅為個人使用之中文整合，未取得商業授權；如有版權爭議請聯絡 issue 區告知，會立即處理。

## 致謝

- **MonkeyDM** — 原始 *Steinhardt's Guide to the Eldritch Hunt* 設計者。
- **badgerwerks (trioderegion)** — Foundry 模組程式碼。
- **InYourLibrary** — 模組共同維護。
- **HKTRPG** — Foundry 核心 zh-TW 翻譯。
- **5e-complete 翻譯貢獻者** — sgeh-items pack 既有翻譯。
