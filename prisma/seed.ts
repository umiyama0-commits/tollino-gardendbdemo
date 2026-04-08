import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.similarityClusterMember.deleteMany();
  await prisma.similarityCluster.deleteMany();
  await prisma.crossIndustryPattern.deleteMany();
  await prisma.insightTag.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.observationTag.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.spatialZone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.store.deleteMany();
  await prisma.client.deleteMany();
  await prisma.ontologyTag.deleteMany();
  await prisma.user.deleteMany();

  // ===== OntologyTag Master (98 tags) =====

  // BehaviorTag L1 - MOVEMENT (9)
  const behaviorMovement = [
    { code: "entry", displayNameJa: "入店", description: "顧客が店舗に入る行動" },
    { code: "exit", displayNameJa: "退店", description: "顧客が店舗から出る行動" },
    { code: "circulation", displayNameJa: "回遊", description: "店内を巡回する行動" },
    { code: "stop", displayNameJa: "滞留", description: "特定の場所に立ち止まる行動" },
    { code: "pass_through", displayNameJa: "通過", description: "立ち止まらずに通り過ぎる行動" },
    { code: "u_turn", displayNameJa: "Uターン", description: "引き返す行動" },
    { code: "route_choice", displayNameJa: "経路選択", description: "複数経路から選択する行動" },
    { code: "staff_movement", displayNameJa: "スタッフ動線", description: "スタッフの移動パターン" },
    { code: "queue", displayNameJa: "待ち行列", description: "順番待ちの行動" },
  ];

  // BehaviorTag L1 - APPROACH (10)
  const behaviorApproach = [
    { code: "greeting", displayNameJa: "声掛け", description: "顧客への最初の挨拶・声掛け" },
    { code: "eye_contact", displayNameJa: "アイコンタクト", description: "視線の交わり" },
    { code: "product_touch", displayNameJa: "商品タッチ", description: "商品に触れる行動" },
    { code: "trial", displayNameJa: "試着・試用", description: "商品を試す行動" },
    { code: "needs_hearing", displayNameJa: "ニーズヒアリング", description: "顧客のニーズを聞き出す行動" },
    { code: "proposal", displayNameJa: "提案", description: "商品やサービスを提案する行動" },
    { code: "demonstration", displayNameJa: "デモンストレーション", description: "商品の実演" },
    { code: "explanation", displayNameJa: "説明", description: "商品やサービスの説明" },
    { code: "closing", displayNameJa: "クロージング", description: "購入決定を促す行動" },
    { code: "follow_up", displayNameJa: "フォローアップ", description: "購入後のフォロー" },
  ];

  // BehaviorTag L1 - BREAKDOWN (8)
  const behaviorBreakdown = [
    { code: "missed_contact", displayNameJa: "接触機会逸失", description: "顧客との接点を逃す" },
    { code: "wait_abandonment", displayNameJa: "待ち離脱", description: "待ち時間に耐えきれず離脱" },
    { code: "staff_absence", displayNameJa: "スタッフ不在", description: "必要な場面でスタッフがいない" },
    { code: "post_contact_drop", displayNameJa: "接触後離脱", description: "接客後に購入に至らず離脱" },
    { code: "quality_degradation", displayNameJa: "品質低下", description: "サービス品質が低下する" },
    { code: "capacity_overload", displayNameJa: "キャパシティ超過", description: "処理能力を超える状態" },
    { code: "process_error", displayNameJa: "プロセスエラー", description: "業務プロセスのミス" },
    { code: "customer_confusion", displayNameJa: "顧客混乱", description: "顧客が混乱する状態" },
  ];

  // BehaviorTag L1 - TRANSFER (7)
  const behaviorTransfer = [
    { code: "shadowing", displayNameJa: "シャドーイング", description: "先輩の業務を観察して学ぶ" },
    { code: "handoff", displayNameJa: "引き継ぎ", description: "業務の引き渡し" },
    { code: "checklist", displayNameJa: "チェックリスト", description: "確認リストによる業務管理" },
    { code: "peer_sharing", displayNameJa: "ピアシェアリング", description: "同僚間での知見共有" },
    { code: "manual_reference", displayNameJa: "マニュアル参照", description: "マニュアルを参照する行動" },
    { code: "coaching", displayNameJa: "コーチング", description: "指導・育成" },
    { code: "pattern_replication", displayNameJa: "パターン再現", description: "成功パターンの横展開" },
  ];

  // ContextTag L1 (23)
  const contextTags = [
    { code: "peak_hour", displayNameJa: "ピーク時間", description: "来客数が多い時間帯" },
    { code: "off_peak", displayNameJa: "閑散時間", description: "来客数が少ない時間帯" },
    { code: "opening", displayNameJa: "開店時", description: "開店直後の時間帯" },
    { code: "closing_time", displayNameJa: "閉店時", description: "閉店前の時間帯" },
    { code: "seasonal_peak", displayNameJa: "繁忙期", description: "季節的な繁忙期" },
    { code: "solo_staff", displayNameJa: "ワンオペ", description: "スタッフ1名での運営" },
    { code: "duo_staff", displayNameJa: "2名体制", description: "スタッフ2名での運営" },
    { code: "full_staff", displayNameJa: "フル体制", description: "全スタッフでの運営" },
    { code: "newbie_on_floor", displayNameJa: "新人配置", description: "新人がフロアにいる状態" },
    { code: "veteran_only", displayNameJa: "ベテランのみ", description: "経験豊富なスタッフのみ" },
    { code: "mixed_experience", displayNameJa: "混合経験", description: "経験レベルが混在" },
    { code: "purpose_visit", displayNameJa: "目的来店", description: "明確な目的を持った来店" },
    { code: "browse_visit", displayNameJa: "回遊来店", description: "特定の目的なく立ち寄る" },
    { code: "group_visit", displayNameJa: "グループ来店", description: "複数人での来店" },
    { code: "solo_visit", displayNameJa: "一人来店", description: "一人での来店" },
    { code: "first_visit", displayNameJa: "初来店", description: "初めての来店" },
    { code: "repeat_visit", displayNameJa: "リピート来店", description: "2回目以降の来店" },
    { code: "high_intent", displayNameJa: "高購買意欲", description: "購入意欲が高い状態" },
    { code: "low_intent", displayNameJa: "低購買意欲", description: "購入意欲が低い状態" },
    { code: "sc_location", displayNameJa: "SC立地", description: "ショッピングセンター内店舗" },
    { code: "street_location", displayNameJa: "路面店", description: "路面に面した店舗" },
    { code: "department_store", displayNameJa: "百貨店", description: "百貨店内店舗" },
    { code: "airport_station", displayNameJa: "空港・駅", description: "空港・駅ナカ店舗" },
  ];

  // SpaceTag L1 (11)
  const spaceTags = [
    { code: "entrance", displayNameJa: "入口", description: "店舗の入口エリア" },
    { code: "storefront", displayNameJa: "店頭", description: "店舗の前面エリア" },
    { code: "main_display", displayNameJa: "メイン陳列", description: "主要な商品陳列エリア" },
    { code: "sub_display", displayNameJa: "サブ陳列", description: "補助的な商品陳列エリア" },
    { code: "trial_area", displayNameJa: "試着・試用エリア", description: "商品を試すエリア" },
    { code: "service_counter", displayNameJa: "サービスカウンター", description: "接客カウンター" },
    { code: "checkout", displayNameJa: "レジ", description: "会計エリア" },
    { code: "waiting_area", displayNameJa: "待合エリア", description: "待機スペース" },
    { code: "backyard", displayNameJa: "バックヤード", description: "従業員専用エリア" },
    { code: "workstation", displayNameJa: "作業台", description: "スタッフの作業スペース" },
    { code: "transition_zone", displayNameJa: "移行ゾーン", description: "エリア間の移行空間" },
  ];

  // TheoryTag L1 (30)
  const theoryTags = [
    // 意思決定系
    { code: "anchoring", displayNameJa: "アンカリング", description: "最初の情報が基準点として意思決定に影響", category: "意思決定系" },
    { code: "hicks_law", displayNameJa: "ヒックの法則", description: "選択肢が増えると意思決定時間が対数的に増加", category: "意思決定系" },
    { code: "paradox_of_choice", displayNameJa: "選択のパラドックス", description: "選択肢過多が満足度低下を招く", category: "意思決定系" },
    { code: "default_effect", displayNameJa: "デフォルト効果", description: "初期設定がそのまま選ばれやすい", category: "意思決定系" },
    { code: "framing", displayNameJa: "フレーミング", description: "同じ情報でも提示の仕方で判断が変わる", category: "意思決定系" },
    // 接点・接客系
    { code: "mere_exposure", displayNameJa: "単純接触効果", description: "接触回数が増えるほど好意度が上がる", category: "接点・接客系" },
    { code: "social_proof", displayNameJa: "社会的証明", description: "他者の行動を参考にする傾向", category: "接点・接客系" },
    { code: "reciprocity", displayNameJa: "返報性", description: "受けた好意に対して返そうとする心理", category: "接点・接客系" },
    { code: "peak_end_rule", displayNameJa: "ピーク・エンドの法則", description: "体験の評価はピークと最後の印象で決まる", category: "接点・接客系" },
    { code: "primacy_recency", displayNameJa: "初頭効果・親近効果", description: "最初と最後の情報が記憶に残りやすい", category: "接点・接客系" },
    // 空間・動線・身体系
    { code: "right_turn_bias", displayNameJa: "右回り傾向", description: "人は自然と右方向に進む傾向", category: "空間・動線・身体系" },
    { code: "gruen_transfer", displayNameJa: "グルーエン効果", description: "計画的な空間設計が衝動的行動を誘発", category: "空間・動線・身体系" },
    { code: "attention_bottleneck", displayNameJa: "注意のボトルネック", description: "処理容量の制限により注意が絞られる", category: "空間・動線・身体系" },
    { code: "golden_zone", displayNameJa: "ゴールデンゾーン", description: "目線〜腰の高さが最も注目される", category: "空間・動線・身体系" },
    { code: "fatigue_curve", displayNameJa: "疲労曲線", description: "時間経過に伴うパフォーマンス低下", category: "空間・動線・身体系" },
    { code: "proxemics", displayNameJa: "プロクセミクス", description: "対人距離が心理に与える影響", category: "空間・動線・身体系" },
    { code: "wayfinding", displayNameJa: "ウェイファインディング", description: "空間内での経路探索行動", category: "空間・動線・身体系" },
    // 離脱・待ち系
    { code: "loss_aversion", displayNameJa: "損失回避", description: "損失の痛みは同等の利得の喜びより大きい", category: "離脱・待ち系" },
    { code: "wait_perception", displayNameJa: "待ち時間知覚", description: "体感待ち時間は実際より長く感じる", category: "離脱・待ち系" },
    { code: "goal_gradient", displayNameJa: "目標勾配効果", description: "ゴールに近づくほど行動が加速する", category: "離脱・待ち系" },
    // 認知・学習系
    { code: "cognitive_load", displayNameJa: "認知負荷", description: "情報処理に要する精神的負荷", category: "認知・学習系" },
    { code: "schema", displayNameJa: "スキーマ", description: "既存の知識構造に基づく理解の枠組み", category: "認知・学習系" },
    { code: "working_memory", displayNameJa: "ワーキングメモリ", description: "一時的な情報保持と処理の容量制限", category: "認知・学習系" },
    { code: "mirror_neuron", displayNameJa: "ミラーニューロン", description: "他者の行動を観察すると同じ神経が活性化", category: "認知・学習系" },
    { code: "automaticity", displayNameJa: "自動性", description: "繰り返しにより行動が自動化される", category: "認知・学習系" },
    { code: "spacing_effect", displayNameJa: "間隔効果", description: "分散学習が集中学習より定着率が高い", category: "認知・学習系" },
    { code: "desirable_difficulty", displayNameJa: "望ましい困難", description: "適度な困難が長期的な学習を促進", category: "認知・学習系" },
    { code: "observational_learning", displayNameJa: "観察学習", description: "他者の行動を観察して学習する", category: "認知・学習系" },
    { code: "chunking", displayNameJa: "チャンキング", description: "情報をまとまりに整理して処理効率を向上", category: "認知・学習系" },
    // 組織・定着系
    { code: "psychological_safety", displayNameJa: "心理的安全性", description: "失敗しても罰せられないという信念", category: "組織・定着系" },
  ];

  // Create all tags
  const tagMap: Record<string, string> = {};

  for (const tag of behaviorMovement) {
    const created = await prisma.ontologyTag.create({
      data: { type: "BEHAVIOR", code: tag.code, displayNameJa: tag.displayNameJa, description: tag.description, modelLayer: "MOVEMENT" },
    });
    tagMap[tag.code] = created.id;
  }
  for (const tag of behaviorApproach) {
    const created = await prisma.ontologyTag.create({
      data: { type: "BEHAVIOR", code: tag.code, displayNameJa: tag.displayNameJa, description: tag.description, modelLayer: "APPROACH" },
    });
    tagMap[tag.code] = created.id;
  }
  for (const tag of behaviorBreakdown) {
    const created = await prisma.ontologyTag.create({
      data: { type: "BEHAVIOR", code: tag.code, displayNameJa: tag.displayNameJa, description: tag.description, modelLayer: "BREAKDOWN" },
    });
    tagMap[tag.code] = created.id;
  }
  for (const tag of behaviorTransfer) {
    const created = await prisma.ontologyTag.create({
      data: { type: "BEHAVIOR", code: tag.code, displayNameJa: tag.displayNameJa, description: tag.description, modelLayer: "TRANSFER" },
    });
    tagMap[tag.code] = created.id;
  }
  for (const tag of contextTags) {
    const created = await prisma.ontologyTag.create({
      data: { type: "CONTEXT", code: tag.code, displayNameJa: tag.displayNameJa, description: tag.description },
    });
    tagMap[tag.code] = created.id;
  }
  for (const tag of spaceTags) {
    const created = await prisma.ontologyTag.create({
      data: { type: "SPACE", code: tag.code, displayNameJa: tag.displayNameJa, description: tag.description },
    });
    tagMap[tag.code] = created.id;
  }
  for (const tag of theoryTags) {
    const created = await prisma.ontologyTag.create({
      data: { type: "THEORY", code: tag.code, displayNameJa: tag.displayNameJa, description: tag.description, category: tag.category },
    });
    tagMap[tag.code] = created.id;
  }

  console.log(`Created ${Object.keys(tagMap).length} OntologyTags`);

  // ===== Clients & Stores =====
  const owndays = await prisma.client.create({
    data: {
      name: "OWNDAYS",
      industry: "小売",
      industryDetail: "眼鏡小売",
      scale: "中規模チェーン",
      stores: {
        create: [
          { name: "柏店", locationType: "SC", area: 60, staffCount: 5, address: "千葉県柏市" },
          { name: "伊丹昆陽店", locationType: "SC", area: 55, staffCount: 4, address: "兵庫県伊丹市" },
        ],
      },
    },
    include: { stores: true },
  });

  const foodA = await prisma.client.create({
    data: {
      name: "飲食A社",
      industry: "飲食",
      industryDetail: "カフェ・レストラン",
      stores: {
        create: [{ name: "渋谷店", locationType: "street", area: 80, staffCount: 8, address: "東京都渋谷区" }],
      },
    },
    include: { stores: true },
  });

  const apparelB = await prisma.client.create({
    data: {
      name: "アパレルB社",
      industry: "アパレル",
      industryDetail: "カジュアルウェア",
      stores: {
        create: [{ name: "新宿店", locationType: "department_store", area: 120, staffCount: 10, address: "東京都新宿区" }],
      },
    },
    include: { stores: true },
  });

  // ===== Projects =====
  const owndaysProject = await prisma.project.create({
    data: {
      clientId: owndays.id,
      name: "OWNDAYS接客最適化プロジェクト",
      hypothesisTheme: "接客タイミングと成約率の関係",
      primaryValueAxis: "REVENUE_UP",
      targetKPI: "接客発生率・成約率",
      status: "active",
      startDate: new Date("2025-10-01"),
    },
  });

  // ===== Observations (20) =====
  const kashiwaStore = owndays.stores.find((s) => s.name === "柏店")!;
  const itamiStore = owndays.stores.find((s) => s.name === "伊丹昆陽店")!;
  const shibuyaStore = foodA.stores[0];
  const shinjukuStore = apparelB.stores[0];

  // Helper function
  async function createObservation(data: {
    text: string;
    modelLayer: string;
    provenance: string;
    primaryValueAxis?: string;
    confidence?: string;
    projectId?: string;
    storeId?: string;
    sourceType?: string;
    sourceTitle?: string;
    tagCodes: string[];
  }) {
    const obs = await prisma.observation.create({
      data: {
        text: data.text,
        modelLayer: data.modelLayer,
        provenance: data.provenance,
        primaryValueAxis: data.primaryValueAxis,
        confidence: data.confidence || "MEDIUM",
        projectId: data.projectId,
        storeId: data.storeId,
        sourceType: data.sourceType,
        sourceTitle: data.sourceTitle,
      },
    });
    for (const code of data.tagCodes) {
      if (tagMap[code]) {
        await prisma.observationTag.create({
          data: { observationId: obs.id, tagId: tagMap[code] },
        });
      }
    }
    return obs;
  }

  // FIELD_OBSERVED (10)
  const obs1 = await createObservation({
    text: "入店後3秒以内の声掛けで接客発生率が2.1倍に向上",
    modelLayer: "APPROACH", provenance: "FIELD_OBSERVED", primaryValueAxis: "REVENUE_UP", confidence: "HIGH",
    projectId: owndaysProject.id, storeId: kashiwaStore.id,
    tagCodes: ["greeting", "mere_exposure", "entrance"],
  });
  const obs2 = await createObservation({
    text: "2択比較提案時の成約率は3択以上と比較して32%高い",
    modelLayer: "APPROACH", provenance: "FIELD_OBSERVED", primaryValueAxis: "REVENUE_UP", confidence: "HIGH",
    projectId: owndaysProject.id, storeId: kashiwaStore.id,
    tagCodes: ["proposal", "hicks_law", "service_counter"],
  });
  const obs3 = await createObservation({
    text: "ピーク時スタッフ3名以下で接客品質が急落（60㎡店舗）",
    modelLayer: "BREAKDOWN", provenance: "FIELD_OBSERVED", primaryValueAxis: "COST_DOWN", confidence: "HIGH",
    projectId: owndaysProject.id, storeId: kashiwaStore.id,
    tagCodes: ["capacity_overload", "cognitive_load", "peak_hour"],
  });
  const obs4 = await createObservation({
    text: "スタッフ作業動線30cm短縮で累計移動距離15%減少",
    modelLayer: "MOVEMENT", provenance: "FIELD_OBSERVED", primaryValueAxis: "COST_DOWN", confidence: "MEDIUM",
    projectId: owndaysProject.id, storeId: itamiStore.id,
    tagCodes: ["staff_movement", "fatigue_curve", "workstation"],
  });
  const obs5 = await createObservation({
    text: "新人シャドーイング1日で独り立ち1週間短縮",
    modelLayer: "TRANSFER", provenance: "FIELD_OBSERVED", primaryValueAxis: "RETENTION", confidence: "MEDIUM",
    projectId: owndaysProject.id, storeId: kashiwaStore.id,
    tagCodes: ["shadowing", "observational_learning", "newbie_on_floor"],
  });
  const obs6 = await createObservation({
    text: "引き継ぎチェックリスト導入でシフト間ミス70%減",
    modelLayer: "TRANSFER", provenance: "FIELD_OBSERVED", primaryValueAxis: "COST_DOWN", confidence: "HIGH",
    projectId: owndaysProject.id, storeId: kashiwaStore.id,
    tagCodes: ["checklist", "handoff", "chunking"],
  });
  const obs7 = await createObservation({
    text: "メガネ試着3回以上の顧客の購入率92%",
    modelLayer: "APPROACH", provenance: "FIELD_OBSERVED", primaryValueAxis: "REVENUE_UP", confidence: "HIGH",
    projectId: owndaysProject.id, storeId: kashiwaStore.id,
    tagCodes: ["trial", "goal_gradient", "trial_area"],
  });
  const obs8 = await createObservation({
    text: "入口右側の棚の商品タッチ率が左側より28%高い",
    modelLayer: "MOVEMENT", provenance: "FIELD_OBSERVED", primaryValueAxis: "REVENUE_UP", confidence: "MEDIUM",
    projectId: owndaysProject.id, storeId: kashiwaStore.id,
    tagCodes: ["circulation", "product_touch", "right_turn_bias", "entrance"],
  });
  const obs9 = await createObservation({
    text: "閑散時間帯のスタッフ配置最適化で人件費12%削減",
    modelLayer: "MOVEMENT", provenance: "FIELD_OBSERVED", primaryValueAxis: "COST_DOWN", confidence: "MEDIUM",
    projectId: owndaysProject.id, storeId: itamiStore.id,
    tagCodes: ["staff_movement", "off_peak"],
  });
  const obs10 = await createObservation({
    text: "朝礼での成功事例共有がチーム帰属意識を高め離職率12%低下",
    modelLayer: "TRANSFER", provenance: "FIELD_OBSERVED", primaryValueAxis: "RETENTION", confidence: "MEDIUM",
    projectId: owndaysProject.id, storeId: kashiwaStore.id,
    tagCodes: ["peer_sharing", "psychological_safety"],
  });

  // ANONYMIZED_DERIVED (4)
  await createObservation({
    text: "小売SC立地60㎡で接客あり購入率は接客なし比4倍",
    modelLayer: "APPROACH", provenance: "ANONYMIZED_DERIVED", primaryValueAxis: "REVENUE_UP", confidence: "HIGH",
    tagCodes: ["greeting", "sc_location", "service_counter"],
  });
  await createObservation({
    text: "サービス業全般で声掛け応答率はピーク時に40%低下",
    modelLayer: "BREAKDOWN", provenance: "ANONYMIZED_DERIVED", primaryValueAxis: "COST_DOWN", confidence: "MEDIUM",
    tagCodes: ["greeting", "capacity_overload", "peak_hour"],
  });
  await createObservation({
    text: "入口右側への自然な流入傾向は業種を問わず60-70%",
    modelLayer: "MOVEMENT", provenance: "ANONYMIZED_DERIVED", primaryValueAxis: "REVENUE_UP", confidence: "HIGH",
    tagCodes: ["circulation", "right_turn_bias", "entrance"],
  });
  await createObservation({
    text: "新人の独り立ち期間はシャドーイング有無で平均5日差",
    modelLayer: "TRANSFER", provenance: "ANONYMIZED_DERIVED", primaryValueAxis: "RETENTION", confidence: "MEDIUM",
    tagCodes: ["shadowing", "observational_learning", "newbie_on_floor"],
  });

  // PUBLIC_CODIFIED (6)
  await createObservation({
    text: "選択肢が3つ以上になると意思決定が平均40%遅延（Hick's Law研究）",
    modelLayer: "APPROACH", provenance: "PUBLIC_CODIFIED", primaryValueAxis: "REVENUE_UP", confidence: "HIGH",
    sourceType: "academic", sourceTitle: "Hick's Law研究",
    tagCodes: ["hicks_law", "paradox_of_choice"],
  });
  await createObservation({
    text: "体感待ち時間は実測の1.3〜2.0倍（待ち時間心理学メタ分析）",
    modelLayer: "BREAKDOWN", provenance: "PUBLIC_CODIFIED", primaryValueAxis: "COST_DOWN", confidence: "HIGH",
    sourceType: "academic", sourceTitle: "待ち時間心理学メタ分析",
    tagCodes: ["wait_perception", "queue", "waiting_area"],
  });
  await createObservation({
    text: "分散型研修は集中型と比較して定着率2.3倍（spacing effect研究）",
    modelLayer: "TRANSFER", provenance: "PUBLIC_CODIFIED", primaryValueAxis: "RETENTION", confidence: "HIGH",
    sourceType: "academic", sourceTitle: "spacing effect研究",
    tagCodes: ["spacing_effect", "desirable_difficulty"],
  });
  await createObservation({
    text: "心理的安全性の高いチームは離職率が26%低い（Google Project Aristotle）",
    modelLayer: "TRANSFER", provenance: "PUBLIC_CODIFIED", primaryValueAxis: "RETENTION", confidence: "HIGH",
    sourceType: "industry_report", sourceTitle: "Google Project Aristotle",
    tagCodes: ["psychological_safety"],
  });
  await createObservation({
    text: "単純接触効果により接触回数と好意度は対数的に相関（Zajonc 1968追試）",
    modelLayer: "APPROACH", provenance: "PUBLIC_CODIFIED", primaryValueAxis: "REVENUE_UP", confidence: "HIGH",
    sourceType: "academic", sourceTitle: "Zajonc 1968追試",
    tagCodes: ["mere_exposure"],
  });
  await createObservation({
    text: "ゴールデンゾーン（目線〜腰）の商品は棚全体売上の65%を占める",
    modelLayer: "MOVEMENT", provenance: "PUBLIC_CODIFIED", primaryValueAxis: "REVENUE_UP", confidence: "HIGH",
    sourceType: "industry_report", sourceTitle: "小売業ゴールデンゾーン調査",
    tagCodes: ["golden_zone", "main_display"],
  });

  console.log("Created 20 Observations");

  // ===== Insights (10) =====
  async function createInsight(data: {
    text: string;
    evidenceStrength?: string;
    generalizability?: string;
    primaryValueAxis?: string;
    modelLayer?: string;
    provenance: string;
    applicableConditions?: string;
    tagCodes: string[];
  }) {
    const insight = await prisma.insight.create({
      data: {
        text: data.text,
        evidenceStrength: data.evidenceStrength || "MEDIUM",
        generalizability: data.generalizability || "MEDIUM",
        primaryValueAxis: data.primaryValueAxis,
        modelLayer: data.modelLayer,
        provenance: data.provenance,
        applicableConditions: data.applicableConditions,
      },
    });
    for (const code of data.tagCodes) {
      if (tagMap[code]) {
        await prisma.insightTag.create({
          data: { insightId: insight.id, tagId: tagMap[code] },
        });
      }
    }
    return insight;
  }

  const insight1 = await createInsight({
    text: "入店直後（3秒以内）の声掛けが接客発生率を大幅に向上させる。SC立地小型店舗で特に効果が高い。",
    evidenceStrength: "HIGH", generalizability: "HIGH", primaryValueAxis: "REVENUE_UP", modelLayer: "APPROACH",
    provenance: "FIELD_OBSERVED",
    applicableConditions: "SC立地、60㎡前後の小型店舗、眼鏡小売・アパレル",
    tagCodes: ["greeting", "mere_exposure"],
  });
  const insight2 = await createInsight({
    text: "選択肢を2択に絞ることで成約率が向上する。ヒックの法則に基づく認知負荷軽減が要因。",
    evidenceStrength: "HIGH", generalizability: "HIGH", primaryValueAxis: "REVENUE_UP", modelLayer: "APPROACH",
    provenance: "FIELD_OBSERVED",
    applicableConditions: "商品比較提案時、特に高単価商品",
    tagCodes: ["proposal", "hicks_law"],
  });
  const insight3 = await createInsight({
    text: "60㎡店舗ではスタッフ3名がキャパシティの臨界点。これを下回るとサービス品質が急落する。",
    evidenceStrength: "HIGH", generalizability: "MEDIUM", primaryValueAxis: "COST_DOWN", modelLayer: "BREAKDOWN",
    provenance: "FIELD_OBSERVED",
    applicableConditions: "60㎡前後のSC立地小売店",
    tagCodes: ["capacity_overload", "cognitive_load"],
  });
  const insight4 = await createInsight({
    text: "スタッフ動線の微小改善（数十cm単位）でも累積効果は大きく、疲労軽減・効率向上に直結する。",
    evidenceStrength: "MEDIUM", generalizability: "MEDIUM", primaryValueAxis: "COST_DOWN", modelLayer: "MOVEMENT",
    provenance: "FIELD_OBSERVED",
    tagCodes: ["staff_movement", "fatigue_curve"],
  });
  const insight5 = await createInsight({
    text: "シャドーイングは新人教育の最も効率的な手法。1日の実施で独り立ち期間を大幅短縮できる。",
    evidenceStrength: "MEDIUM", generalizability: "HIGH", primaryValueAxis: "RETENTION", modelLayer: "TRANSFER",
    provenance: "FIELD_OBSERVED",
    tagCodes: ["shadowing", "observational_learning"],
  });
  const insight6 = await createInsight({
    text: "商品の試着・試用回数が増えるほど購入確率は非線形に上昇する（目標勾配効果）。",
    evidenceStrength: "HIGH", generalizability: "MEDIUM", primaryValueAxis: "REVENUE_UP", modelLayer: "APPROACH",
    provenance: "FIELD_OBSERVED",
    tagCodes: ["trial", "goal_gradient"],
  });
  const insight7 = await createInsight({
    text: "入口右側に注力商品を配置することで商品タッチ率を最大化できる（右回り傾向の活用）。",
    evidenceStrength: "HIGH", generalizability: "HIGH", primaryValueAxis: "REVENUE_UP", modelLayer: "MOVEMENT",
    provenance: "ANONYMIZED_DERIVED",
    tagCodes: ["right_turn_bias", "circulation", "entrance"],
  });
  const insight8 = await createInsight({
    text: "チェックリストによる引き継ぎ標準化はシフト間エラーを劇的に削減する。チャンキング理論に合致。",
    evidenceStrength: "HIGH", generalizability: "HIGH", primaryValueAxis: "COST_DOWN", modelLayer: "TRANSFER",
    provenance: "FIELD_OBSERVED",
    tagCodes: ["checklist", "handoff", "chunking"],
  });
  const insight9 = await createInsight({
    text: "心理的安全性の構築（朝礼での共有等）がチーム定着率を高め、結果として育成コストを削減する。",
    evidenceStrength: "MEDIUM", generalizability: "HIGH", primaryValueAxis: "RETENTION", modelLayer: "TRANSFER",
    provenance: "FIELD_OBSERVED",
    tagCodes: ["psychological_safety", "peer_sharing"],
  });
  const insight10 = await createInsight({
    text: "体感待ち時間は実際の1.3〜2倍。待ち環境のデザインで体感を短縮できる。",
    evidenceStrength: "HIGH", generalizability: "HIGH", primaryValueAxis: "COST_DOWN", modelLayer: "BREAKDOWN",
    provenance: "PUBLIC_CODIFIED",
    tagCodes: ["wait_perception", "queue"],
  });

  console.log("Created 10 Insights");

  // ===== CrossIndustryPatterns (3) =====
  await prisma.crossIndustryPattern.create({
    data: {
      name: "声掛け3秒ルール",
      description: "入店後3秒以内の声掛けが接客発生率・成約率を大幅に向上させる。眼鏡小売、アパレル、飲食で共通して確認。",
      industries: JSON.stringify(["眼鏡小売", "アパレル", "飲食"]),
      modelLayer: "APPROACH",
      primaryValueAxis: "REVENUE_UP",
      insightCount: 23,
    },
  });
  await prisma.crossIndustryPattern.create({
    data: {
      name: "2択提案の優位性",
      description: "選択肢を2つに絞った提案が3択以上より高い成約率を示す。ヒックの法則に基づく認知負荷軽減効果。",
      industries: JSON.stringify(["眼鏡小売", "不動産", "保険"]),
      modelLayer: "APPROACH",
      primaryValueAxis: "REVENUE_UP",
      insightCount: 18,
    },
  });
  await prisma.crossIndustryPattern.create({
    data: {
      name: "キャパシティ臨界点",
      description: "店舗面積あたりのスタッフ数に臨界点が存在し、これを下回るとサービス品質が急落する。",
      industries: JSON.stringify(["眼鏡小売", "飲食", "美容室"]),
      modelLayer: "BREAKDOWN",
      primaryValueAxis: "COST_DOWN",
      insightCount: 15,
    },
  });

  console.log("Created 3 CrossIndustryPatterns");

  // ===== SimilarityClusters (3) =====
  const cluster1 = await prisma.similarityCluster.create({
    data: {
      name: "声掛けタイミングと成約率",
      description: "声掛けのタイミング、方法、効果に関する知見クラスター",
      memberCount: 47,
      modelLayer: "APPROACH",
      primaryValueAxis: "REVENUE_UP",
    },
  });
  const cluster2 = await prisma.similarityCluster.create({
    data: {
      name: "選択肢の数と意思決定速度",
      description: "提示する選択肢数が意思決定に与える影響に関するクラスター",
      memberCount: 34,
      modelLayer: "APPROACH",
      primaryValueAxis: "REVENUE_UP",
    },
  });
  const cluster3 = await prisma.similarityCluster.create({
    data: {
      name: "待ち時間と離脱率",
      description: "待ち時間の知覚と顧客離脱の関係に関するクラスター",
      memberCount: 29,
      modelLayer: "BREAKDOWN",
      primaryValueAxis: "COST_DOWN",
    },
  });

  // Add some insights as cluster members
  const clusterInsights = [
    { clusterId: cluster1.id, insightId: insight1.id },
    { clusterId: cluster1.id, insightId: insight6.id },
    { clusterId: cluster2.id, insightId: insight2.id },
    { clusterId: cluster3.id, insightId: insight10.id },
    { clusterId: cluster3.id, insightId: insight3.id },
  ];
  for (const cm of clusterInsights) {
    await prisma.similarityClusterMember.create({ data: cm });
  }

  console.log("Created 3 SimilarityClusters with members");

  // ===== Users =====
  await prisma.user.create({
    data: { name: "田中太郎", email: "tanaka@example.com", role: "consultant" },
  });
  await prisma.user.create({
    data: { name: "鈴木花子", email: "suzuki@example.com", role: "admin" },
  });

  console.log("Created 2 Users");

  // ===== Analysis Tree (PF分析テンプレート) =====
  const pfTemplate = await prisma.analysisTree.create({
    data: {
      title: "小売PF分析テンプレート",
      description: "Tollino Garden標準のPF（パフォーマンス・ファクター）分析フレームワーク。お客様と従業員の負の解消を軸に構造化。",
      isTemplate: true,
      status: "published",
    },
  });

  // Helper to create nodes
  async function createNode(data: {
    treeId: string;
    parentId?: string | null;
    nodeType: string;
    label: string;
    description?: string;
    sortOrder: number;
  }) {
    return prisma.analysisNode.create({
      data: {
        treeId: data.treeId,
        parentId: data.parentId || null,
        nodeType: data.nodeType,
        label: data.label,
        description: data.description || null,
        sortOrder: data.sortOrder,
      },
    });
  }

  // CATEGORY 1: お客様における負の解消
  const cat1 = await createNode({
    treeId: pfTemplate.id,
    nodeType: "CATEGORY",
    label: "お客様における負の解消",
    description: "お客様が店舗で体験するネガティブ要素の特定と解消",
    sortOrder: 1,
  });

  // PERFORMANCE 1-1: 最大待ち組人数
  const perf1 = await createNode({
    treeId: pfTemplate.id, parentId: cat1.id,
    nodeType: "PERFORMANCE", label: "最大待ち組人数", sortOrder: 1,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf1.id,
    nodeType: "INDICATOR", label: "物販レジ待ち組数", sortOrder: 1,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf1.id,
    nodeType: "INDICATOR", label: "くじ引き待ち組数", sortOrder: 2,
  });

  // PERFORMANCE 1-2: 機会損失
  const perf2 = await createNode({
    treeId: pfTemplate.id, parentId: cat1.id,
    nodeType: "PERFORMANCE", label: "機会損失", sortOrder: 2,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf2.id,
    nodeType: "INDICATOR", label: "声掛け不発回数", sortOrder: 1,
  });

  // PERFORMANCE 1-3: 並び直し回数
  const perf3 = await createNode({
    treeId: pfTemplate.id, parentId: cat1.id,
    nodeType: "PERFORMANCE", label: "並び直した回数", sortOrder: 3,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf3.id,
    nodeType: "INDICATOR", label: "レジ再並び回数", sortOrder: 1,
  });

  // PERFORMANCE 1-4: レジ稼働率
  const perf4 = await createNode({
    treeId: pfTemplate.id, parentId: cat1.id,
    nodeType: "PERFORMANCE", label: "レジ稼働率", sortOrder: 4,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf4.id,
    nodeType: "INDICATOR", label: "レジ稼働率(%)", sortOrder: 1,
  });

  // PERFORMANCE 1-5: 待ち時間発生後の体験
  const perf5 = await createNode({
    treeId: pfTemplate.id, parentId: cat1.id,
    nodeType: "PERFORMANCE", label: "待ち時間発生後の体験", sortOrder: 5,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf5.id,
    nodeType: "INDICATOR", label: "待ち中声掛け率", sortOrder: 1,
  });

  // CATEGORY 2: 従業員における負の解消
  const cat2 = await createNode({
    treeId: pfTemplate.id,
    nodeType: "CATEGORY",
    label: "従業員における負の解消",
    description: "従業員の業務負荷・心理的負担の特定と解消",
    sortOrder: 2,
  });

  // PERFORMANCE 2-1: 作業時間の分配
  const perf6 = await createNode({
    treeId: pfTemplate.id, parentId: cat2.id,
    nodeType: "PERFORMANCE", label: "作業時間の分配", sortOrder: 1,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf6.id,
    nodeType: "INDICATOR", label: "接客時間比率(%)", sortOrder: 1,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf6.id,
    nodeType: "INDICATOR", label: "作業時間比率(%)", sortOrder: 2,
  });

  // PERFORMANCE 2-2: 心理的な負荷
  const perf7 = await createNode({
    treeId: pfTemplate.id, parentId: cat2.id,
    nodeType: "PERFORMANCE", label: "心理的な負荷", sortOrder: 2,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf7.id,
    nodeType: "INDICATOR", label: "ストレス指標", sortOrder: 1,
  });

  // PERFORMANCE 2-3: 身体的な負荷
  const perf8 = await createNode({
    treeId: pfTemplate.id, parentId: cat2.id,
    nodeType: "PERFORMANCE", label: "身体的な負荷", sortOrder: 3,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf8.id,
    nodeType: "INDICATOR", label: "移動距離(m/h)", sortOrder: 1,
  });

  // PERFORMANCE 2-4: 開店・閉店作業時間
  const perf9 = await createNode({
    treeId: pfTemplate.id, parentId: cat2.id,
    nodeType: "PERFORMANCE", label: "開店・閉店作業時間", sortOrder: 4,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf9.id,
    nodeType: "INDICATOR", label: "開店作業時間(分)", sortOrder: 1,
  });
  await createNode({
    treeId: pfTemplate.id, parentId: perf9.id,
    nodeType: "INDICATOR", label: "閉店作業時間(分)", sortOrder: 2,
  });

  console.log(`Created PF Analysis Template with nodes (id: ${pfTemplate.id})`);
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
