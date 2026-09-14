/* Phase 2・3 モジュールの「見え方」だけのイメージ画面。データはこのファイル内の架空サンプル。
   app.js から h（ヘルパー束）を受け取って HTML 文字列を返す。 */
window.MODS = (function () {
  "use strict";
  // ---------- 架空サンプル ----------
  const NURSERIES = [
    ["さくら保育園", "チポーレ", "岡村", ["SNS運用（月額）"], "継続", "9/10 月次レポート送付"],
    ["ひまわり第二保育園", "チポーレ", "岡村", ["SNS運用（月額）", "採用LP"], "継続", "9/8 商談（動画追加）"],
    ["つくし認定こども園", "WAYキャスト", "近藤", ["保育士派遣 2名"], "継続", "9/12 契約更新の打診"],
    ["みどりの丘保育園", "WAYキャスト", "近藤", ["保育士派遣 1名", "RPO"], "継続", "9/11 求人原稿の確認"],
    ["あおぞら保育園", "チポーレ", "多田", ["SNS運用（月額）"], "新規", "9/9 初回ヒアリング"],
    ["かえで保育園", "WAYキャスト", "榎本", ["保育士派遣 3名"], "継続", "9/5 タイムシート回収"],
    ["にじいろ保育園 本園", "チポーレ", "岡村", ["SNS運用（月額）", "Instagram広告"], "継続", "9/12 広告レポート"],
    ["にじいろ保育園 分園", "チポーレ", "岡村", ["SNS運用（月額）"], "休止", "8/29 休止のご連絡"],
    ["ことり保育園", "WAYキャスト", "近藤", ["RPO"], "新規", "9/13 求人票ドラフト"],
    ["すみれ幼稚園", "チポーレ", "多田", ["採用LP"], "継続", "9/2 公開"],
    ["わかば保育園", "WAYキャスト", "榎本", ["保育士派遣 1名"], "継続", "9/10 園長面談"],
    ["たんぽぽ認定こども園", "チポーレ", "岡村", ["SNS運用（月額）"], "要フォロー", "8/20 以降接点なし"],
  ];
  const DEALS = [
    ["さくら保育園", "SNS運用（月額）", "チポーレ", 66000, "2025/04", "岡村", "稼働中"],
    ["ひまわり第二保育園", "採用LP 制作", "チポーレ", 220000, "2026/09", "岡村", "制作中"],
    ["つくし認定こども園", "保育士派遣（2名）", "WAYキャスト", 1180000, "2025/10", "近藤", "稼働中"],
    ["みどりの丘保育園", "RPO（採用代行）", "WAYキャスト", 150000, "2026/07", "近藤", "稼働中"],
    ["あおぞら保育園", "SNS運用（月額）", "チポーレ", 66000, "2026/10", "多田", "提案中"],
    ["ことり保育園", "RPO（採用代行）", "WAYキャスト", 150000, "2026/10", "近藤", "見積提示"],
    ["にじいろ保育園 本園", "Instagram広告 運用", "チポーレ", 88000, "2026/06", "岡村", "稼働中"],
    ["たんぽぽ認定こども園", "SNS運用（月額）", "チポーレ", 66000, "2025/06", "岡村", "要フォロー"],
  ];
  const PIPE = [["テレアポ", 42, "今週の架電"], ["アポ取得", 9, "商談待ち"], ["商談", 6, "文字起こし→提案書 自動下書き"], ["提案", 4, "見積提示済み"], ["受注", 2, "今月"]];

  const STAFF = [
    ["佐藤 はな", "つくし認定こども園", "2026/04/01〜2026/09/30", 16, "電子契約済", 1460, 1095, "週5・6h"],
    ["鈴木 みお", "つくし認定こども園", "2026/07/01〜2026/12/31", 108, "電子契約済", 1460, 1095, "週5・7h"],
    ["高橋 ゆい", "みどりの丘保育園", "2026/01/01〜2026/09/30", 16, "電子契約済", 640, 380, "週4・6h"],
    ["田中 りん", "かえで保育園", "2026/04/01〜2027/03/31", 198, "未締結", 1460, 1095, "週5・8h"],
    ["伊藤 さき", "かえで保育園", "2025/10/01〜2026/09/30", 16, "電子契約済", 1460, 730, "週5・6h"],
    ["渡辺 なな", "かえで保育園", "2026/09/01〜2027/02/28", 167, "電子契約済", 1460, 1080, "週3・6h"],
    ["山本 ここ", "わかば保育園", "2026/04/01〜2026/09/30", 16, "電子契約済", 95, 95, "週5・6h"],
    ["中村 あい", "ことり保育園", "2026/10/01〜2027/03/31", 198, "ドラフト", 1095, 1095, "週5・6h"],
  ];
  const WAGE = [["保育士（有資格）", "東京23区", 1450, 1520, 1600], ["保育士（有資格）", "宮崎", 1180, 1240, 1300], ["保育補助（無資格）", "東京23区", 1250, 1300, 1350], ["保育補助（無資格）", "宮崎", 1050, 1090, 1130]];

  const WORK = [
    ["佐藤 はな", "つくし認定こども園", "週5・6h", 21, 126.0, 124.5, "園確認済", 19, 19, 0],
    ["鈴木 みお", "つくし認定こども園", "週5・7h", 21, 147.0, 147.0, "園確認済", 20, 21, 1],
    ["高橋 ゆい", "みどりの丘保育園", "週4・6h", 17, 102.0, 96.0, "園確認待ち", 15, 15, 0],
    ["田中 りん", "かえで保育園", "週5・8h", 21, 168.0, 171.5, "園確認済", 21, 18, -3],
    ["伊藤 さき", "かえで保育園", "週5・6h", 21, 126.0, 108.0, "園確認待ち", 16, 16, 0],
    ["渡辺 なな", "かえで保育園", "週3・6h", 13, 78.0, 78.0, "園確認済", 13, 14, 1],
    ["山本 ここ", "わかば保育園", "週5・6h", 21, 126.0, 126.0, "園確認済", 20, 20, 0],
    ["小林 ひな", "みどりの丘保育園", "週5・6h", 21, 126.0, 120.0, "園確認待ち", 18, 18, 0],
  ];

  const BILLS = [
    ["チポーレ", "さくら保育園", "SNS運用 9月分", 72600, "2026/09/30", "メール（PDF）", "入金待ち"],
    ["チポーレ", "ひまわり第二保育園", "SNS運用 9月分", 72600, "2026/09/30", "メール（PDF）", "入金待ち"],
    ["チポーレ", "にじいろ保育園 本園", "SNS運用＋広告 9月分", 169400, "2026/09/30", "収納代行（リコーリース）", "送付済"],
    ["WAYキャスト", "つくし認定こども園", "保育士派遣 9月分（2名）", 1298000, "2026/09/30", "収納代行（リコーリース）", "未送付（実働確定待ち）"],
    ["WAYキャスト", "みどりの丘保育園", "派遣 9月分＋RPO", 814000, "2026/09/30", "メール（PDF）", "未送付（実働確定待ち）"],
    ["WAYキャスト", "かえで保育園", "保育士派遣 9月分（3名）", 1947000, "2026/09/30", "収納代行（リコーリース）", "未送付（実働確定待ち）"],
    ["チポーレ", "たんぽぽ認定こども園", "SNS運用 8月分", 72600, "2026/08/31", "メール（PDF）", "期日超過（14日）"],
    ["チポーレ", "すみれ幼稚園", "採用LP 制作（一括）", 242000, "2026/08/31", "メール（PDF）", "入金済"],
    ["ホールディングス", "チポーレ", "経営指導料 9月分", 330000, "2026/09/30", "社内", "送付済"],
  ];
  const DEPOSITS = [
    ["2026/09/12", "サクラホイクエン", 72600, "さくら保育園 SNS運用 8月分", "自動消込", ""],
    ["2026/09/12", "リコーリース（収納代行）", 1298000, "つくし認定こども園 8月分", "自動消込", ""],
    ["2026/09/11", "カ）スミレガクエン", 242000, "すみれ幼稚園 採用LP", "自動消込", ""],
    ["2026/09/10", "ヒマワリダイニホイクエン", 72000, "ひまわり第二 8月分（¥72,600）", "要確認", "¥600 不足（振込手数料の差引？）"],
    ["2026/09/09", "ニジイロホイクエン", 169400, "にじいろ本園 8月分", "自動消込", ""],
    ["2026/09/05", "不明入金", 66000, "—", "要確認", "該当する請求が見つかりません"],
  ];

  const banner = (phase, text) => `<div class="banner"><b>${phase} のイメージ画面。</b>${text} 数字は架空のサンプルで、ボタンを押しても記録はされません。</div>`;
  const stat = (k, v, s, tone) => `<div class="card stat"><p class="k">${k}</p><p class="v num" ${tone ? `style="color:${tone}"` : ""}>${v}</p><p class="s num">${s}</p></div>`;
  const demoBtn = (label, cls) => `<button class="btn btn-sm ${cls || "btn-ghost"}" data-act="demo-only">${label}</button>`;
  const status = (s) => {
    const m = { "継続": "green", "新規": "gold", "休止": "gray", "要フォロー": "red", "稼働中": "green", "制作中": "gold", "提案中": "gold", "見積提示": "gold", "電子契約済": "green", "未締結": "red", "ドラフト": "amber", "園確認済": "green", "園確認待ち": "amber", "入金待ち": "gold", "送付済": "gold", "入金済": "green", "自動消込": "green", "要確認": "red" };
    let tone = m[s] || (s.startsWith("未送付") ? "gray" : s.startsWith("期日超過") ? "red" : "gray");
    return `<span class="pill ${tone}">${s}</span>`;
  };

  // ---------- 全体像 ----------
  function overview(h) {
    const mods = [
      ["①", "顧客と案件を1つで持つ", "ナレッジスイート・売上スプシの二重管理の解消。管理君の資産も統合", "ナレッジスイート ／ 売上スプレッドシート", "p2", "Phase 2", "#/customers"],
      ["②", "契約と派遣台帳を持つ", "派遣元管理台帳・抵触日・賃金テーブルを1か所で", "スタッフナビゲーター（契約）", "p3", "Phase 3", "#/contracts"],
      ["③", "請求から入金まで持つ", "相手に登録をお願いしなくて済む。3社3系統の請求書発行を1つに", "BtoBプラットフォーム", "p2", "Phase 2", "#/billing"],
      ["④", "派遣の実働と喫食を持つ", "喫食の突合を1件ずつ数える作業が消える。契約と実働の差が見える", "e-navi ／ 給食費のExcel", "p3", "Phase 3", "#/work"],
      ["⑤", "支払いを集めて承認を通す", "「知らない間に払っている」がなくなる", "（新規）", "live", "今日触れる", "#/"],
      ["⑥", "法人をまとめて把握する", "法人別・事業部別PLと支払承認", "（新規）", "live", "今日触れる", "#/pl"],
    ];
    return `<div class="page">
      <header><p class="eyebrow">全体像</p><h1 class="title">3社の管理業務を、1つの基幹でまとめる</h1><p class="lead">9/15 資料の6モジュールです。⑥⑤を最初に作り（10〜12月）、次に①③（1〜4月）、最後に②④の派遣領域（5〜8月）。緑は今日このデモで触れる部分、それ以外は完成後の見え方のイメージです。</p></header>
      <div class="mods">${mods.map(([n, t, e, r, tone, tag, href]) => `<a class="card mod ${tone === "live" ? "card-key" : ""}" href="${href}"><div class="no"><span>${n}</span><span class="tag ${tone}">${tag}</span></div><h3>${t}</h3><p class="eff">${e}</p><p class="rep">廃止できるもの: <b>${r}</b></p></a>`).join("")}</div>
      <section class="card"><div class="hd"><h2 style="font-size:16px">残してつなぐもの <small>法令が中に入っていて、毎年の追従が必要なもの</small></h2></div>
        <div class="p6" style="padding-top:0"><div class="keep"><span>弥生会計<small>顧問税理士との連携と決算</small></span><span>弥生給与<small>税・社保の料率が毎年変わる</small></span><span>ハーモス勤怠<small>労働基準法の要件が実装済み</small></span><span>リコーリース<small>収納代行は資金決済法の領域</small></span><span>電子契約<small>電子署名法の要件</small></span></div></div></section>
      <section class="card"><div class="hd"><h2 style="font-size:16px">お金と情報の流れ <small>左から右へ。基幹が継ぎ目を引き受ける</small></h2></div>
        <div class="p6" style="padding-top:0"><div class="flow">
          <div><p class="k">① 顧客・案件</p>保育園と案件を1つの台帳に</div>
          <div><p class="k">② 契約・台帳</p>契約更新・抵触日・賃金テーブル</div>
          <div><p class="k">④ 実働・喫食</p>打刻はハーモス、園が確認、喫食を突合</div>
          <div><p class="k">③ 請求・入金</p>実働から請求書を起こし、入金を消込</div>
          <div class="live"><p class="k">⑤ 支払承認</p>届いた請求書を代表が承認</div>
          <div class="live"><p class="k">⑥ 法人まとめ</p>弥生の数字を法人・事業部で見る</div>
        </div></div></section>
    </div>`;
  }

  // ---------- ① 顧客と案件 ----------
  function customers(h, p) {
    const tab = p.get("tab") || "nursery";
    const { esc, yen } = h;
    return `<div class="page">
      <header class="ph"><div><p class="eyebrow">① 顧客と案件を1つで持つ <span class="tag p2" style="margin-left:8px">Phase 2</span></p><h1 class="title">保育園と案件を、1つの台帳で</h1><p class="lead">ナレッジスイートの顧客リストと売上スプレッドシートを1つにします。中里さんの「管理君」（テレアポ管理・商談以降）もここに統合する前提です。</p></div>
        <div class="row">${demoBtn("保育園を追加", "btn-primary")}${demoBtn("CSVで取り込む")}</div></header>
      ${banner("Phase 2（1〜4月）", "顧客・案件・営業の3つのタブ。")}
      <section class="stats4">${stat("保育園（顧客）", "58", "うち稼働中 51")}${stat("稼働中の案件", "74", "SNS運用 38 ／ 派遣 29 ／ RPO 7")}${stat("今月の新規", "3", "あおぞら・ことり ほか", "var(--gold-d)")}${stat("要フォロー", "5", "20日以上接点なし", "#b91c1c")}</section>
      <div class="tabs"><a class="btn btn-sm ${tab === "nursery" ? "btn-primary" : "btn-ghost"}" href="#/customers">保育園リスト</a><a class="btn btn-sm ${tab === "deals" ? "btn-primary" : "btn-ghost"}" href="#/customers?tab=deals">案件</a><a class="btn btn-sm ${tab === "sales" ? "btn-primary" : "btn-ghost"}" href="#/customers?tab=sales">営業（管理君の統合先）</a></div>
      ${tab === "nursery" ? `<section class="card"><div class="scroll"><table class="data"><thead><tr><th>保育園</th><th>担当法人</th><th>担当</th><th>契約中の案件</th><th>状態</th><th>直近の接点</th><th></th></tr></thead><tbody>
        ${NURSERIES.map(([n, le, o, d, s, last]) => `<tr class="link"><td class="semi">${esc(n)}</td><td class="small">${esc(le)}</td><td class="small">${esc(o)}</td><td class="small">${d.map(esc).join("、")}</td><td>${status(s)}</td><td class="small sub">${esc(last)}</td><td class="right">${demoBtn("開く")}</td></tr>`).join("")}
      </tbody></table></div><p class="ft">1つの園に複数法人の案件が付くケース（SNS運用はチポーレ、派遣はWAYキャスト）も、園を1つのレコードで持ちます。統合後は法人の区別が事業部の区別になります。</p></section>` : ""}
      ${tab === "deals" ? `<section class="card"><div class="scroll"><table class="data"><thead><tr><th>保育園</th><th>案件</th><th>法人</th><th class="right">月額／金額</th><th>開始</th><th>担当</th><th>状態</th></tr></thead><tbody>
        ${DEALS.map(([n, d, le, amt, from, o, s]) => `<tr class="link"><td class="semi">${esc(n)}</td><td>${esc(d)}</td><td class="small">${esc(le)}</td><td class="num right nowrap">${yen(amt)}</td><td class="num small">${from}</td><td class="small">${esc(o)}</td><td>${status(s)}</td></tr>`).join("")}
      </tbody></table></div><p class="ft">案件が「稼働中」になると、③の請求書発行の元になります。売上スプレッドシートに手で転記する作業がなくなります。</p></section>` : ""}
      ${tab === "sales" ? `<section class="card"><div class="hd"><h2 style="font-size:16px">営業パイプライン <small>管理君 V1（テレアポ）・V2（商談以降）をここへ</small></h2></div>
        <div class="pipeline">${PIPE.map(([k, v, s]) => `<div><p class="k">${k}</p><p class="v num">${v}</p><p class="s">${s}</p></div>`).join("")}</div>
        <p class="ft">商談の文字起こしから提案資料の下書きまで自動生成する仕組みは、管理君で既に動いているものをそのまま引き継ぎます。引き継ぎの範囲は 9/15 の論点2です。</p></section>` : ""}
    </div>`;
  }

  // ---------- ② 契約と派遣台帳 ----------
  function contracts(h, p) {
    const tab = p.get("tab") || "contracts";
    const { esc } = h;
    const days = (d) => d <= 30 ? `<span class="diff">${d}日</span>` : d <= 90 ? `<span class="warn semi">${d}日</span>` : `${d}日`;
    return `<div class="page">
      <header class="ph"><div><p class="eyebrow">② 契約と派遣台帳を持つ <span class="tag p3" style="margin-left:8px">Phase 3</span></p><h1 class="title">契約の更新と、派遣法の台帳を1か所で</h1><p class="lead">スタッフナビゲーターの契約機能をここへ。個別契約書は電子契約と連携し、派遣元管理台帳・抵触日・労使協定方式の賃金テーブルを持ちます。法定項目は社労士監修で確定します。</p></div>
        <div class="row">${demoBtn("契約を作成", "btn-primary")}${demoBtn("台帳をPDFで出力")}</div></header>
      ${banner("Phase 3（5〜8月）", "派遣元管理台帳（3年保存）・抵触日・賃金テーブルの見え方。")}
      <section class="stats4">${stat("派遣中のスタッフ", "78", "施設 58")}${stat("30日以内に更新期限", "5", "9/30 期限", "#b91c1c")}${stat("個別契約書 未締結", "1", "田中 りん（かえで）", "#b45309")}${stat("抵触日 1年以内", "3", "個人単位", "#b45309")}</section>
      <div class="tabs"><a class="btn btn-sm ${tab === "contracts" ? "btn-primary" : "btn-ghost"}" href="#/contracts">契約と抵触日</a><a class="btn btn-sm ${tab === "wage" ? "btn-primary" : "btn-ghost"}" href="#/contracts?tab=wage">賃金テーブル（労使協定方式）</a></div>
      ${tab === "contracts" ? `<section class="card"><div class="scroll"><table class="data"><thead><tr><th>スタッフ</th><th>派遣先</th><th>契約期間</th><th class="right">更新まで</th><th>個別契約書</th><th class="right">抵触日まで（事業所）</th><th class="right">抵触日まで（個人）</th><th>就業条件</th><th></th></tr></thead><tbody>
        ${STAFF.map(([n, s, term, left, doc, ent, ind, cond]) => `<tr class="link"><td class="semi">${esc(n)}</td><td class="small">${esc(s)}</td><td class="num small nowrap">${term}</td><td class="num right">${days(left)}</td><td>${status(doc)}</td><td class="num right">${days(ent)}</td><td class="num right">${days(ind)}</td><td class="small">${cond}</td><td class="right">${demoBtn("更新")}</td></tr>`).join("")}
      </tbody></table></div><p class="ft">更新期限と抵触日は、1ヶ月前・3ヶ月前に担当へ通知します。派遣元管理台帳・就業条件明示書・マージン率の算出は、要件定義で法定項目を1つずつ潰してから実装します。</p></section>` : ""}
      ${tab === "wage" ? `<section class="card"><div class="hd"><h2 style="font-size:16px">賃金テーブル <small>労使協定方式 ／ 職種 × 地域 × 経験年数</small></h2></div>
        <div class="scroll"><table class="data"><thead><tr><th>職種</th><th>地域</th><th class="right">0年</th><th class="right">1年</th><th class="right">3年</th></tr></thead><tbody>
        ${WAGE.map(([j, a, w0, w1, w3]) => `<tr><td class="semi">${j}</td><td class="small">${a}</td><td class="num right">¥${w0.toLocaleString()}</td><td class="num right">¥${w1.toLocaleString()}</td><td class="num right">¥${w3.toLocaleString()}</td></tr>`).join("")}
        </tbody></table></div><p class="ft">毎年公表される一般賃金水準（局長通達）と比較し、下回っていれば赤で出します。数字はサンプルで、実際の値は社労士監修で確定します。</p></section>` : ""}
    </div>`;
  }

  // ---------- ④ 実働と喫食 ----------
  function work(h, p) {
    const tab = p.get("tab") || "month";
    const { esc } = h;
    const hrs = (n) => n.toFixed(1) + "h";
    return `<div class="page">
      <header class="ph"><div><p class="eyebrow">④ 派遣の実働と喫食を持つ <span class="tag p3" style="margin-left:8px">Phase 3</span></p><h1 class="title">実働と喫食を、数えずに突き合わせる</h1><p class="lead">打刻はハーモス勤怠から自動で取ります（紙のタイムシートと e-navi は廃止）。園が月末に実働を確認し、喫食は本人の申告と園の集計を自動で突き合わせます。ズレた行だけ電話すればよくなります。</p></div>
        <div class="row">${demoBtn("園に確認を依頼", "btn-secondary")}${demoBtn("弥生給与へ賃金データを出力", "btn-primary")}</div></header>
      ${banner("Phase 3（5〜8月）", "近藤さんの「1件ずつ数える」作業がなくなる部分。")}
      <section class="stats4">${stat("対象スタッフ", "78", "2026年9月")}${stat("園確認待ち", "12", "9/25 締め", "#b45309")}${stat("喫食に差あり", "4", "本人申告 ≠ 園集計", "#b91c1c")}${stat("契約との差", "3", "実働が契約時間の90%未満", "#b91c1c")}</section>
      <div class="tabs"><a class="btn btn-sm ${tab === "month" ? "btn-primary" : "btn-ghost"}" href="#/work">月次実働（管理部の画面）</a><a class="btn btn-sm ${tab === "nursery" ? "btn-primary" : "btn-ghost"}" href="#/work?tab=nursery">園の確認画面（イメージ）</a></div>
      ${tab === "month" ? `<section class="card card-key"><div class="hd"><h2 style="font-size:16px">2026年9月 実働と喫食 <small>ハーモス勤怠の打刻 → 園確認 → 喫食突合</small></h2></div>
        <div class="scroll"><table class="data"><thead><tr><th>スタッフ</th><th>派遣先</th><th>契約</th><th class="right">出勤日数</th><th class="right">契約時間</th><th class="right">実働（打刻）</th><th>園確認</th><th class="right">喫食 本人</th><th class="right">喫食 園</th><th>アラート</th></tr></thead><tbody>
        ${WORK.map(([n, s, c, d, ct, ac, st, mSelf, mNur, diff]) => { const ratio = ac / ct; const alerts = []; if (diff !== 0) alerts.push(`喫食が${Math.abs(diff)}食ずれています（${diff > 0 ? "園の集計が多い" : "本人申告が多い"}）`); if (ratio < 0.9) alerts.push(`実働が契約の${Math.round(ratio * 100)}%。欠勤か時短の確認`); if (ratio > 1.02) alerts.push(`契約時間を超過（残業 ${hrs(ac - ct)}）`);
          return `<tr class="link"><td class="semi">${esc(n)}</td><td class="small">${esc(s)}</td><td class="small">${c}</td><td class="num right">${d}</td><td class="num right">${hrs(ct)}</td><td class="num right ${ratio < 0.9 || ratio > 1.02 ? "diff" : ""}">${hrs(ac)}<div class="bar ${ratio < 0.9 ? "bad" : ratio > 1.02 ? "warn" : ""}" style="margin-top:4px"><i style="width:${Math.min(100, Math.round(ratio * 100))}%"></i></div></td><td>${status(st)}</td><td class="num right">${mSelf}</td><td class="num right ${diff ? "diff" : ""}">${mNur}</td><td style="min-width:220px">${alerts.length ? `<ul class="flags">${alerts.map((a) => `<li>${a}</li>`).join("")}</ul>` : '<span class="muted">—</span>'}</td></tr>`; }).join("")}
        </tbody></table></div><p class="ft">園確認が揃うと、③の請求（園への派遣料）と、弥生給与への賃金データ（スタッフへの給与）が同じ実働から作られます。給食費は喫食数 × 単価で園ごとに集計し、Excel を廃止します。</p></section>` : ""}
      ${tab === "nursery" ? `<div class="en">
        <section class="card p6"><h2 style="font-size:16px">園長・主任が見る画面（スマホ想定）</h2><p class="small sub mt1">月末に届くリンクを開き、スタッフごとの実働と喫食数を確認して「確認する」を押すだけ。園側のアカウント登録は不要にします（メールのリンクで本人確認）。</p>
          <div class="phone mt4"><p class="ph-hd">つくし認定こども園 ／ 2026年9月の実働確認</p>
            <div class="item"><div class="row"><span class="semi">佐藤 はな</span>${status("園確認済")}</div><div class="small sub">出勤 21日 ／ 実働 124.5h ／ 喫食 19食</div></div>
            <div class="item"><div class="row"><span class="semi">鈴木 みお</span>${status("園確認待ち")}</div><div class="small sub">出勤 21日 ／ 実働 147.0h ／ 喫食 <span class="diff">21食（本人申告は20食）</span></div><div class="row mt2">${demoBtn("この内容で確認", "btn-primary")}${demoBtn("違う")}</div></div>
            <div class="item"><div class="row"><span class="semi">高橋 ゆい</span>${status("園確認待ち")}</div><div class="small sub">出勤 17日 ／ 実働 96.0h ／ 喫食 15食</div><div class="row mt2">${demoBtn("この内容で確認", "btn-primary")}${demoBtn("違う")}</div></div>
          </div></section>
        <section class="card p6"><h2 style="font-size:16px">園との連携で決めること</h2>
          <ul class="mt3" style="margin:12px 0 0;padding-left:18px;font-size:14px;line-height:1.9">
            <li><b>誰が確認するか</b>。園長か主任か、園ごとに違う。確認者を園マスタに持つ</li>
            <li><b>喫食の正</b>。本人申告と園集計がずれたとき、どちらを請求と給食費の根拠にするか</li>
            <li><b>締め日</b>。園の確認締め（例: 25日）と請求・給与の締めをどう合わせるか</li>
            <li><b>紙の園</b>。スマホを使わない園には、PDFを送って返信で確認する経路を残すか</li>
            <li><b>e-navi の廃止時期</b>。並行稼働の期間と、過去データの移行範囲</li>
          </ul>
          <p class="note mt4">ここは 9/10 のヒアリングで一番時間がかかっていた業務です。画面の形より先に、上の5点を園側と決める必要があります。</p></section>
      </div>` : ""}
    </div>`;
  }

  // ---------- ③ 請求から入金 ----------
  function billing(h, p) {
    const tab = p.get("tab") || "invoices";
    const { esc, yen } = h;
    const total = BILLS.filter((b) => b[4].startsWith("2026/09")).reduce((a, b) => a + b[3], 0);
    return `<div class="page">
      <header class="ph"><div><p class="eyebrow">③ 請求から入金まで持つ <span class="tag p2" style="margin-left:8px">Phase 2</span></p><h1 class="title">3社の請求書を1つの形で出し、入金を消し込む</h1><p class="lead">BtoBプラットフォーム（相手に登録をお願いする必要があった）、スタッフナビゲーター、Excel の3系統を1つにします。送付はメールのPDFか、リコーリースの収納代行。入金は銀行明細と自動で突き合わせます。</p></div>
        <div class="row">${demoBtn("9月分をまとめて発行", "btn-primary")}${demoBtn("リコーリースへ送信")}</div></header>
      ${banner("Phase 2（1〜4月）", "請求書発行と入金消込の見え方。")}
      <section class="stats4">${stat("9月分 発行予定", yen(total), `${BILLS.filter((b) => b[4].startsWith("2026/09")).length}件（3社合計）`)}${stat("入金待ち", yen(145200), "2件")}${stat("期日超過", yen(72600), "1件 ／ 14日", "#b91c1c")}${stat("自動消込率", "83%", "今月 6件中 5件", "#047857")}</section>
      <div class="tabs"><a class="btn btn-sm ${tab === "invoices" ? "btn-primary" : "btn-ghost"}" href="#/billing">請求書の発行</a><a class="btn btn-sm ${tab === "deposits" ? "btn-primary" : "btn-ghost"}" href="#/billing?tab=deposits">入金の消込</a></div>
      ${tab === "invoices" ? `<section class="card"><div class="scroll"><table class="data"><thead><tr><th>発行元</th><th>宛先</th><th>内容</th><th class="right">金額（税込）</th><th>期日</th><th>送付方法</th><th>状態</th><th></th></tr></thead><tbody>
        ${BILLS.map(([le, to, d, amt, due, via, s]) => `<tr class="link"><td class="small">${esc(le)}</td><td class="semi">${esc(to)}</td><td class="small">${esc(d)}</td><td class="num right nowrap">${yen(amt)}</td><td class="num small">${due}</td><td class="small">${esc(via)}</td><td>${status(s)}</td><td class="right">${s.startsWith("未送付") ? demoBtn("発行") : s.startsWith("期日超過") ? demoBtn("催促する", "btn-danger") : demoBtn("開く")}</td></tr>`).join("")}
      </tbody></table></div><p class="ft">派遣の請求は④の園確認が終わると自動で金額が入ります。ホールディングスから事業会社への経営指導料も同じ画面で出し、⑥の内部取引消去の対象になります。</p></section>` : ""}
      ${tab === "deposits" ? `<section class="card"><div class="hd"><h2 style="font-size:16px">入金の消込 <small>銀行明細（またはリコーリースの回収結果）と請求を突き合わせる</small></h2></div>
        <div class="scroll"><table class="data"><thead><tr><th>入金日</th><th>振込名義</th><th class="right">入金額</th><th>突き合わせた請求</th><th>判定</th><th>メモ</th><th></th></tr></thead><tbody>
        ${DEPOSITS.map(([d, name, amt, inv, s, memo]) => `<tr class="link"><td class="num small">${d}</td><td class="small">${esc(name)}</td><td class="num right nowrap">${yen(amt)}</td><td class="small">${esc(inv)}</td><td>${status(s)}</td><td class="small warn">${esc(memo)}</td><td class="right">${s === "要確認" ? demoBtn("手で消込") : ""}</td></tr>`).join("")}
        </tbody></table></div><p class="ft">名義のカナと金額で自動で当て、合わないものだけ人が見ます。リコーリース経由の入金（6割）は回収結果ファイルを取り込んで消込みます。</p></section>` : ""}
    </div>`;
  }

  return {
    nav: [
      { grp: "全体", items: [["overview", "", "全体像", "6モジュールの地図", ""]] },
      { grp: "Phase 1 ／ 今日触れる", items: [["", "⑤", "支払の承認", "5日・10日・月末にどこへいくら払うか", ""], ["inbox", "⑤", "請求書の受信箱", "届いた請求書を確定する", ""], ["pl", "⑥", "法人別・事業部別PL", "弥生から取り込んだ数字", ""], ["imports", "⑥", "弥生との連携", "CSVの出し入れ", ""]] },
      { grp: "Phase 2 ／ イメージ", items: [["customers", "①", "顧客と案件", "保育園と案件を1つの台帳で", "img"], ["billing", "③", "請求から入金", "3社の請求書を1つに、入金を消込", "img"]] },
      { grp: "Phase 3 ／ イメージ", items: [["contracts", "②", "契約と派遣台帳", "更新期限・抵触日・賃金テーブル", "img"], ["work", "④", "実働と喫食", "勤怠ログと園の確認、喫食の突合", "img"]] },
    ],
    pages: { overview, customers, contracts, work, billing },
  };
})();
