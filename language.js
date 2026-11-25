const DuskLanguage = (() => {
  const names = {ko: '한국어', ja: '日本語', en: 'English'};
  const messages = {
    "적 미끄러짐":["Enemy slips","敵が滑った時"],
    "카운터 적중":["Counter hit","カウンター命中"],
    "물줄기 세 번째 분사":["Every third jet","3回目の放水"],
  "김덕수": [
    "Kim Deok-su",
    "キム・ドクス"
  ],
  "물걸레": [
    "Wet Mop",
    "水モップ"
  ],
  "긴 물걸레로 한 줄을 밀고, 6마리마다 미끄러운 바닥을 남긴다.": [
    "Push a long, narrow mop. Every six kills leave a slick floor.",
    "長いモップで直線を突く。6体倒すたびに滑る床を残す。"
  ],
  "광장의 첫 발자국": [
    "Footprints in the plaza",
    "広場の足跡"
  ],
  "첫차도 안 왔는데 발자국이 열두 개야. 저놈들, 신발도 안 털었구먼.": [
    "Twelve muddy footprints before the first bus? They never even wiped their feet.",
    "始発前なのに泥の足跡が十二個。靴ぐらい拭いてくれよ。"
  ],
  "덕수가 걸레를 짜자 돌바닥에 가로등이 비쳤다. 뒤쫓던 괴물이 제 발에 미끄러졌다.": [
    "Deok-su wrings his mop. A lamp glints on the cobbles. The creature on his heels slides right past.",
    "ドクスがモップを絞ると石畳に街灯が映った。追ってきた魔物が滑って通り過ぎた。"
  ],
  "연장 자루": [
    "Telescopic shaft",
    "伸縮柄"
  ],
  "찌르기 사거리 +12": [
    "Thrust reach +12",
    "突きの射程 +12"
  ],
  "광택 왁스": [
    "Floor wax",
    "床ワックス"
  ],
  "미끄럼 반경 +5": [
    "Slick radius +5",
    "滑る床の半径 +5"
  ],
  "속성 걸레질": [
    "Quick polish",
    "早磨き"
  ],
  "바닥 생성에 필요한 처치 수 −1": [
    "One fewer kill per slick",
    "床生成に必要な撃破数 −1"
  ],
  "박철수": [
    "Park Cheol-su",
    "パク・チョルス"
  ],
  "빗자루": [
    "Broom",
    "ほうき"
  ],
  "짧게 파고들어 공격 직전의 적을 친다. 카운터 시 18% 확률로 모래바람이 분다.": [
    "Strike at close range during an enemy attack. Counters have an 18% chance to summon a sandstorm.",
    "間合いを詰めて敵の攻撃に合わせる。カウンター時18%で砂嵐が起こる。"
  ],
  "역풍 부는 골목": [
    "Wind against the grain",
    "向かい風の路地"
  ],
  "바람 부는 날엔 쓸어 봐야 헛수고지. 그래서 난 바람이 돌아설 때까지 기다려.": [
    "No point sweeping into the wind. I wait for it to turn.",
    "風に逆らって掃いても無駄さ。風向きが変わるのを待つんだ。"
  ],
  "철수는 빗자루를 세우고 숨을 골랐다. 괴물이 덤비는 순간, 골목의 모래가 먼저 일어섰다.": [
    "Cheol-su plants his broom and waits. As the creature lunges, the sand in the alley rises first.",
    "チョルスはほうきを立てて待った。魔物が飛びかかった瞬間、路地の砂が舞い上がった。"
  ],
  "되치기": [
    "Riposte",
    "切り返し"
  ],
  "카운터 추가 피해 +1": [
    "Counter bonus damage +1",
    "カウンター追加ダメージ +1"
  ],
  "바람잡이": [
    "Wind catcher",
    "風読み"
  ],
  "모래바람 확률 +4%p": [
    "Sandstorm chance +4 percentage points",
    "砂嵐の確率 +4ポイント"
  ],
  "회오리 빗살": [
    "Vortex bristles",
    "旋風の穂先"
  ],
  "모래바람 탐색 반경 +18": [
    "Sandstorm search radius +18",
    "砂嵐の索敵半径 +18"
  ],
  "장억수": [
    "Jang Eok-su",
    "チャン・オクス"
  ],
  "물 호스": [
    "Water hose",
    "ホース"
  ],
  "빠른 관통 물줄기로 얼룩을 씻는다. 가끔 호스가 꺾이면 잠시 수리한다.": [
    "Rapid piercing jets wash stains away. A kink occasionally interrupts the stream for repairs.",
    "貫通する水流で汚れを洗う。時々ホースが折れ曲がり修理が必要になる。"
  ],
  "급수탑의 새벽": [
    "Daybreak at the water tower",
    "給水塔の夜明け"
  ],
  "압력 좋고, 밸브 좋고… 누가 또 호스 위에 수레를 세웠어?": [
    "Pressure good. Valve good. Who parked a cart on my hose again?",
    "水圧よし、バルブよし……またホースの上に荷車を置いたのは誰だ？"
  ],
  "억수가 매듭을 풀자 시커먼 벽에 물길이 뚫렸다. 그 뒤로 가게 간판의 푸른 글자가 드러났다.": [
    "Eok-su frees the kink. Water cuts a stripe through the grime, revealing blue letters on an old shop sign.",
    "オクスがねじれを直すと黒い壁に水の筋が走り、古い看板の青い文字が現れた。"
  ],
  "고압 노즐": [
    "Pressure nozzle",
    "高圧ノズル"
  ],
  "물줄기 사거리 +14": [
    "Jet reach +14",
    "水流の射程 +14"
  ],
  "보강 피복": [
    "Braided sleeve",
    "補強被覆"
  ],
  "고장 확률 −1%p": [
    "Jam chance −1 percentage point",
    "故障率 −1ポイント"
  ],
  "현장 공구": [
    "Field toolkit",
    "携帯工具"
  ],
  "수리 시간 −0.22초": [
    "Repair time −0.22s",
    "修理時間 −0.22秒"
  ],
  "쓱싹 대작전": [
    "Operation Clean Sweep",
    "おそうじ大作戦"
  ],
  "다음": [
    "Next",
    "次へ"
  ],
  "건너뛰기": [
    "Skip",
    "スキップ"
  ],
  "출동": [
    "Head out",
    "出動"
  ],
  "깨끗한 바닥": [
    "Polished floor",
    "磨いた床"
  ],
  "모래바람": [
    "Sandstorm",
    "砂嵐"
  ],
  "카운터": [
    "Counter",
    "カウンター"
  ],
  "호스 수리": [
    "Hose repair",
    "ホース修理"
  ],
  "게임 소리": [
    "Game audio",
    "ゲーム音声"
  ],
  "전체 음량": [
    "Master volume",
    "全体音量"
  ],
  "배경 음악": [
    "Music",
    "背景音楽"
  ],
  "전투 정보": [
    "Combat details",
    "戦闘情報"
  ],
  "주 무기 공격": [
    "Primary attack",
    "主武器攻撃"
  ],
  "주 무기 적중": [
    "Primary hit",
    "主武器命中"
  ]
,
    "달빛 빗자루": ["Moonlight Broom", "月光のほうき"],
    "공격 범위와 피해가 증가합니다.": ["Increases sweep range and damage.", "攻撃範囲とダメージが上がる。"],
    "회전 비눗방울": ["Orbiting Bubbles", "回転シャボン玉"],
    "몸 주위를 도는 비눗방울이 적을 스칠 때마다 공격합니다.": ["Bubbles orbit you and damage enemies on contact.", "周囲を回るシャボン玉が触れた敵を攻撃する。"],
    "별가루 분무기": ["Stardust Sprayer", "星くずの霧吹き"],
    "가까운 적을 향해 벽에 닿을 때까지 관통하는 물줄기를 쏩니다.": ["Fires a stream at a nearby enemy. It pierces targets until it hits a wall.", "近くの敵に向けて、壁に当たるまで敵を貫く水流を放つ。"],
    "정화의 파동": ["Cleansing Wave", "浄化の波動"],
    "일정 간격으로 사방에 정화 파동을 퍼뜨립니다.": ["Sends out a cleansing wave at regular intervals.", "一定間隔で周囲に浄化の波動を放つ。"],
    "손놀림 연습": ["Quick Hands", "手さばきの稽古"],
    "주 무기의 재사용 대기시간과 자동 공격 주기가 12% 짧아집니다.": ["Reduces primary cooldown and automatic attack intervals by 12%.", "主武器の再使用時間と自動攻撃の間隔が12%短くなる。"],
    "수거용 자석": ["Pickup Magnet", "回収用磁石"],
    "멀리 있는 경험치까지 끌어당깁니다.": ["Pulls in XP crystals from farther away.", "遠くの経験値結晶も引き寄せる。"],
    "따뜻한 차": ["Warm Tea", "温かいお茶"],
    "최대 체력과 현재 체력이 1씩 증가합니다.": ["Raises current and maximum HP by 1.", "現在HPと最大HPが1増える。"],
    "금이 간 오염 통을 주 무기로 치면 주변 통까지 연쇄 폭발합니다.": ["Hit a cracked barrel with your primary weapon to set off a chain of explosions.", "ひび割れた汚染樽を主武器で叩くと、周りの樽も連鎖爆発する。"],
    "길이 갈라지면 어디든 먼저 탐색할 수 있습니다.": ["At a fork, you can explore either path first.", "分かれ道では好きな道から探索できる。"],
    "피격 없이 연속 처치하면 겁먹은 몬스터가 청소를 돕습니다.": ["Defeat enemies without taking damage and frightened monsters will help you clean.", "無傷で敵を連続撃破すると、おびえた魔物が掃除を手伝ってくれる。"],
    "솔 · 광장 파수꾼": ["Sol · Plaza Keeper", "ソル・広場の番人"],
    "세 번째 빗질마다 공명 파동을 냅니다.": ["Every third sweep releases a resonance wave.", "3回目の掃撃ごとに共鳴波を放つ。"],
    "울림 증폭": ["Amplified Echo", "共鳴増幅"],
    "공명 파동 피해 +2": ["Resonance wave damage +2", "共鳴波のダメージ +2"],
    "장대 빗자루": ["Longstaff Broom", "長柄ぼうき"],
    "모든 빗질과 파동의 사거리 +12": ["All sweeps and waves gain 12 range.", "掃撃と波動の射程 +12"],
    "루비 · 화약 조제사": ["Ruby · Powder Mixer", "ルビー・火薬調合師"],
    "네 번째 빗질이 적중하면 지연 폭발을 일으킵니다.": ["Landing every fourth sweep triggers a delayed blast.", "4回目の掃撃を当てると遅延爆発が起きる。"],
    "고농축 약제": ["Concentrated Reagent", "高濃度試薬"],
    "기폭제 폭발 피해 +2": ["Catalyst blast damage +2", "起爆剤の爆発ダメージ +2"],
    "확산 배합": ["Dispersal Mix", "拡散配合"],
    "기폭제 폭발 반경 +10": ["Catalyst blast radius +10", "起爆剤の爆発半径 +10"],
    "모아 · 정령지기": ["Moa · Spirit Keeper", "モア・精霊守"],
    "회전 비눗방울을 지니고, 무피격 2연속 처치부터 동료를 모읍니다.": ["Starts with Orbiting Bubbles. Recruit allies after two kills without taking damage.", "回転シャボン玉を持って開始。無傷で2体連続撃破すると仲間を勧誘できる。"],
    "무리 훈련": ["Pack Training", "群れの訓練"],
    "임시 동료의 공격 피해 +1": ["Temporary ally damage +1", "臨時の仲間の攻撃力 +1"],
    "수호 궤도": ["Guardian Orbit", "守護の軌道"],
    "비눗방울 접촉 피해 +1": ["Bubble contact damage +1", "シャボン玉の接触ダメージ +1"],
    "일시 정지": ["Pause", "一時停止"],
    "다음 지역 도착 · ": ["Next area · ", "次のエリアへ · "],
    "탐험 시작 · ": ["Expedition started · ", "探索開始 · "],
    " · 오염 무리 출현": [" · A tainted horde appears", " · 汚染された群れが出現"],
    "중간 보스 · 황혼의 종지기 출현": ["Midboss · The Dusk Bellkeeper appears", "中ボス・黄昏の鐘守が出現"],
    "최종 보스 · 자정의 종지기 출현": ["Final boss · The Midnight Bellkeeper appears", "最終ボス・真夜中の鐘守が出現"],
    "종지기 출현 · 바닥의 붉은 종소리를 피하세요": ["Bellkeeper approaching! Avoid the red circles on the ground.", "鐘守が出現！ 地面の赤い円を避けよう。"],
    " · 잠김": [" · Locked", " · 未解放"],
    " · 사거리 +": [" · Range +", " · 射程 +"],
    " · 공명 피해 ": [" · Resonance damage ", " · 共鳴ダメージ "],
    "초": ["s", "秒"],
    "준비": ["Ready", "準備完了"],
    "빗자루 ": ["Broom ", "ほうき "],
    "회피 ": ["Dodge ", "回避 "],
    "분무기 ": ["Sprayer ", "霧吹き "],
    "파동 ": ["Wave ", "波動 "],
    "공명 ": ["Resonance in ", "共鳴まで "],
    "회 후": [" swings", "回"],
    "기폭제 ": ["Catalyst in ", "起爆まで "],
    "비눗방울 접촉 간격 ": ["Bubble hit interval ", "シャボン玉の接触間隔 "],
    "초/적": ["s per enemy", "秒／体"],
    "자동": ["Auto", "自動"],
    "수동": ["Manual", "手動"],
    " · 공속 ": [" · Attack speed ", " · 攻撃速度 "],
    "회/초": ["/s", "回／秒"],
    "저주 발동 · ": ["Curse activated · ", "呪い発動 · "],
    "갈대 여울 · 감속": ["Reed shallows · Slowed", "葦の浅瀬 · 減速"],
    "바람 돌길 · 가속": ["Windstone path · Haste", "風の石道 · 加速"],
    "반딧불 화단": ["Firefly bed", "蛍の花壇"],
    "달안개 ": ["Moonmist ", "月霧 "],
    "반전 ": ["Mirrored ", "左右反転 "],
    "새벽의 종": ["Dawn Bell", "夜明けの鐘"],
    "축복": ["Blessing", "祝福"],
    "현재 화면에 보이는 적(레벨 보스 제외)을 모두 처치합니다. 동료는 보호됩니다.": ["Defeats enemies on screen, except level bosses. Allies are safe.", "画面内の敵を一掃する。レベルボスと仲間は対象外。"],
    "접힌 지도": ["Folded Map", "折りたたみ地図"],
    "변화": ["Change", "変化"],
    "새 던전으로 이동합니다. 레벨·장비·체력·카드는 가져가고 방 정화와 동료는 처음부터 시작합니다.": ["Enter a new dungeon with your level, gear, HP and cards. Room progress and allies reset.", "レベル・装備・HP・カードを引き継いで新しいダンジョンへ。部屋の浄化状況と仲間はリセットされる。"],
    "거울 마을": ["Mirror Village", "鏡の村"],
    "저주": ["Curse", "呪い"],
    "20초 동안 필드와 미니맵이 좌우 반전됩니다. 경험치 +6.": ["Mirrors the field and minimap for 20 seconds. Gain 6 XP.", "20秒間フィールドとミニマップが左右反転する。経験値 +6。"],
    "달안개": ["Moonmist", "月霧"],
    "18초 동안 주변만 보입니다. 대가로 경험치 +8.": ["Limits vision to your surroundings for 18 seconds. Gain 8 XP.", "18秒間、近くしか見えなくなる。経験値 +8。"],
    "샘의 선물": ["Spring's Gift", "泉の贈り物"],
    "체력 3을 회복하고 다음 피해를 한 번 막습니다.": ["Restores 3 HP and blocks the next hit.", "HPを3回復し、次のダメージを1回防ぐ。"],
    "서리밤": ["Frost Night", "霜夜"],
    "이미 출현한 적들의 추격 속도를 8초 동안 낮춥니다.": ["Slows enemies already on the field for 8 seconds.", "出現済みの敵の移動速度が8秒間下がる。"],
    "가시 계약": ["Thorn Pact", "いばらの契約"],
    "체력을 최대 2 소모하고 경험치 12를 얻습니다. 체력은 최소 1이 남습니다.": ["Trade up to 2 HP for 12 XP. You keep at least 1 HP.", "HPを最大2消費して経験値を12得る。HPは最低1残る。"],
    "맑은 바람": ["Clear Breeze", "澄んだ風"],
    "안개와 필드 반전을 해제하고 회피를 즉시 준비합니다.": ["Clears mist and mirroring, and readies your dodge.", "霧と左右反転を解除し、すぐに回避できるようになる。"],
    "저주 · 즉시 발동": ["Curse · Activated immediately", "呪い · 即時発動"],
    " · 손패에 추가": [" · Added to hand", " · 手札に追加"],
    "보스 정화 후 이동할 수 있습니다": ["Defeat the boss before traveling.", "ボスを浄化すると移動できる。"],
    " 사용": [" used", " 使用"],
    "닫기": ["Close", "閉じる"],
    "달안개 카드": ["Moonmist Cards", "月霧のカード"],
    "카드 손패": ["Your Hand", "手札"],
    "현재 레벨에서는 ": ["At this level, draw a card every ", "現在のレベルでは "],
    "마리마다 한 장을 뽑습니다. 축복과 지도는 골라 쓰고, 저주는 즉시 발동합니다.": [" kills. Play blessings and maps when you choose. Curses activate immediately.", "体撃破するごとに1枚引く。祝福と地図は好きな時に使え、呪いは即時発動する。"],
    "카드 ": ["Cards ", "カード "],
    "✓ 폭파 의뢰 완료": ["✓ Demolition contract complete", "✓ 爆破依頼達成"],
    "폭파 의뢰 · 폭발로 처치 ": ["Demolition · Blast kills ", "爆破依頼 · 爆発で撃破 "],
    "하드 · ": ["Hard · ", "ハード · "],
    "구역 · ": [" · ", "区画 · "],
    "정화 ": ["Cleansed ", "浄化 "],
    "체력 ": ["HP ", "HP "],
    "황혼의 종지기": ["Dusk Bellkeeper", "黄昏の鐘守"],
    "자정의 종지기": ["Midnight Bellkeeper", "真夜中の鐘守"],
    "이 구역 정화 완료": ["Area cleansed", "エリア浄化完了"],
    "무리 ": ["Wave ", "群れ "],
    " · 정화 ": [" · Cleansed ", " · 浄化 "],
    "수리 작업대": ["Repair Bench", "修理台"],
    "샘물 제단": ["Spring Altar", "泉の祭壇"],
    "청소부의 보급함": ["Janitor's Supply Box", "清掃員の補給箱"],
    "기폭제 · 정화탄 룬 +1 · 네 번째 빗질 폭발 피해 ": ["Catalyst · Purifying bomb rune +1 · Fourth sweep blast damage ", "起爆剤 · 浄化弾ルーン +1 · 4回目の掃撃の爆発ダメージ "],
    "빗살 연장 · 빗질 사거리와 빗질 룬 반경 +12": ["Longer bristles · Sweep range and sweep rune radius +12", "穂先延長 · 掃撃の射程と掃撃ルーンの半径 +12"],
    "공명 손잡이 · 공명과 충격파 룬 피해 +2": ["Resonant handle · Resonance and shockwave rune damage +2", "共鳴の柄 · 共鳴と衝撃波ルーンのダメージ +2"],
    "샘물 마시기 · 최대 체력 +1, 체력 3 회복": ["Drink spring water · Max HP +1, restore 3 HP", "泉の水を飲む · 最大HP +1、HPを3回復"],
    "샘물 부적 · 다음 피해 1회 방어": ["Spring charm · Block the next hit", "泉のお守り · 次のダメージを1回防ぐ"],
    "경험치 결정 +8": ["XP crystals +8", "経験値結晶 +8"],
    "나중에": ["Later", "あとで"],
    "이곳에서는 한 번만 보상을 받을 수 있습니다.": ["Choose one reward. This station can only be used once.", "報酬を1つ選ぼう。この施設を使えるのは1回だけ。"],
    "소리 켜기": ["Enable sound", "サウンドをオン"],
    "소리 끄기": ["Mute sound", "サウンドをオフ"],
    "탐험 이어하기": ["Continue expedition", "探索を続ける"],
    "새 탐험 준비": ["Start a new expedition", "新しい探索を始める"],
    "탐험 준비": ["Start expedition", "探索を始める"],
    "설정": ["Settings", "設定"],
    "하드모드 탐험": ["Hard mode expedition", "ハードモードで探索"],
    "황혼의 청소부": ["Dusk Janitor", "黄昏の清掃員"],
    "달안개 마을의 마지막 야간 근무": ["The last night shift in Moonmist Village", "月霧村、最後の夜勤"],
    " · 장비 칸을 누르면 조합을 설계합니다": [" · Select your equipment to configure combos", " · 装備欄からコンボを組めます"],
    "청소반 명부": ["Cleaning Crew", "清掃班名簿"],
    "캐릭터 선택": ["Choose a janitor", "キャラクター選択"],
    "선택하면 진행 중인 탐험을 끝내고 새 던전에서 시작합니다.": ["Selecting a janitor ends the current expedition and starts a new dungeon.", "選択すると現在の探索を終了し、新しいダンジョンから開始します。"],
    "청소부를 선택하면 탐험이 시작됩니다.": ["Choose a janitor to begin your expedition.", "清掃員を選んで探索を始めましょう。"],
    "뒤로": ["Back", "戻る"],
    "공격 방식": ["Attack controls", "攻撃方式"],
    "기본 공격 자동 조준·연사": ["Auto-aim and repeat basic attacks", "通常攻撃の自動照準・連射"],
    "소리": ["Sound", "サウンド"],
    "효과음": ["Sound effects", "効果音"],
    "효과음 음량": ["Effects volume", "効果音量"],
    "화면과 효과": ["Display and effects", "画面と演出"],
    "화면 배율": ["Zoom", "画面倍率"],
    "미니맵": ["Minimap", "ミニマップ"],
    "화면 흔들림": ["Screen shake", "画面揺れ"],
    "입자 효과 밀도": ["Particle density", "パーティクルの密度"],
    "피해 숫자": ["Damage numbers", "ダメージ表示"],
    "터치 조작": ["Touch controls", "タッチ操作"],
    "오른손 이동 스틱": ["Right-hand movement stick", "移動スティックを右側に配置"],
    "스틱 감도": ["Stick sensitivity", "スティック感度"],
    "조작 버튼 불투명도": ["Control opacity", "操作ボタンの不透明度"],
    "환경 설정": ["Preferences", "環境設定"],
    "변경 사항은 이 기기에 자동 저장됩니다.": ["Changes are saved automatically on this device.", "変更内容はこの端末に自動保存されます。"],
    "완료": ["Done", "完了"],
    "계속하기": ["Resume", "再開"],
    "내 빌드": ["My build", "装備構成"],
    "타이틀로": ["Title screen", "タイトルへ"],
    "도구를 내려놓고 잠시 쉬어 갑니다.": ["Set your broom down and take a breather.", "ほうきを置いて、ひと休み。"],
    "홈 화면에 설치": ["Install on home screen", "ホーム画面に追加"],
    "홈 화면에 설치하려면 Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요.": ["In Safari, open the Share menu and select “Add to Home Screen”.", "Safariの共有メニューで「ホーム画面に追加」を選んでください。"],
    "수동 빗질 적중": ["Manual sweep hit", "手動の掃撃が命中"],
    "회피 시작": ["Dodge start", "回避開始"],
    "경험치 수거": ["XP pickup", "経験値回収"],
    "몬스터 처치": ["Enemy defeated", "敵を撃破"],
    "아군 폭발": ["Friendly blast", "味方の爆発"],
    "동료 공격 적중": ["Ally hit", "仲間の攻撃が命中"],
    "분무기 적중": ["Sprayer hit", "霧吹きが命中"],
    "충격파": ["Shockwave", "衝撃波"],
    "주변 적 전체에 피해를 줍니다.": ["Damages all nearby enemies.", "周囲の敵全体にダメージを与える。"],
    "서릿가루": ["Frost Dust", "霜の粉"],
    "주변 적에게 피해를 주고 이동 속도를 55% 낮춥니다.": ["Damages nearby enemies and slows them by 55%.", "周囲の敵にダメージを与え、移動速度を55%下げる。"],
    "연쇄 번개": ["Chain Lightning", "連鎖稲妻"],
    "가까운 적부터 최대 네 마리 사이를 건너뜁니다.": ["Jumps between up to four nearby enemies.", "近くの敵を最大4体まで伝う。"],
    "팔방 분사": ["Eight-Way Spray", "八方噴射"],
    "여덟 방향으로 관통하는 물방울을 발사합니다.": ["Fires piercing droplets in eight directions.", "8方向に貫通する水滴を放つ。"],
    "소용돌이": ["Vortex", "渦巻き"],
    "벽 너머를 제외한 적과 경험치 결정을 발동 지점으로 당깁니다.": ["Pulls enemies and XP crystals toward the trigger point unless blocked by a wall.", "壁に遮られていない敵と経験値結晶を発動地点に引き寄せる。"],
    "시한 정화탄": ["Timed Purifying Bomb", "時限浄化弾"],
    "잠시 뒤 폭발해 피해를 주고 주변 오염 통을 점화합니다.": ["Explodes after a delay and ignites nearby barrels.", "少し遅れて爆発し、周囲の汚染樽に引火する。"],
    "생기 환원": ["Life Siphon", "生命還元"],
    "주변 적에게 피해를 줍니다. 한 마리라도 맞히면 체력 1을 회복합니다.": ["Damages nearby enemies. Hitting at least one restores 1 HP.", "周囲の敵にダメージを与える。1体以上に当たるとHPを1回復。"],
    "광역형": ["Wide", "広域型"],
    "속사형": ["Rapid", "速射型"],
    "고출력형": ["Heavy", "高出力型"],
    "증폭 코일": ["Amplifier Coil", "増幅コイル"],
    "두 슬롯의 조합 피해 +1": ["Both combo slots gain 1 damage.", "両スロットのコンボダメージ +1。"],
    "확장 렌즈": ["Expansion Lens", "拡張レンズ"],
    "두 슬롯의 조합 반경과 탄 비행거리 +15%": ["Both slots gain 15% radius and projectile range.", "両スロットの半径と弾の飛距離 +15%。"],
    "순환 계전기": ["Cycle Relay", "循環リレー"],
    "두 슬롯의 조합 재사용 시간 10% 단축": ["Reduces both slots’ cooldowns by 10%.", "両スロットの再使用時間を10%短縮。"],
    "정화탄": ["Purifying Bomb", "浄化弾"],
    "청소 장비": ["Cleaning Gear", "清掃装備"],
    "조합 작업실": ["Combo Workshop", "コンボ工房"],
    "발동 조건, 효과, 개조 방식을 선택하세요. 첫 슬롯의 폭발·처치로 두 번째 슬롯을 연쇄 발동할 수 있습니다.": ["Choose a trigger, effect and modifier. Blasts or kills from slot one can trigger slot two.", "条件・効果・改造を選ぼう。第1スロットの爆発や撃破で第2スロットを連鎖発動できる。"],
    "조합 슬롯 ": ["Combo slot ", "コンボスロット "],
    "분무기 탄환이 필요합니다. ": ["Requires sprayer shots. ", "霧吹きの弾が必要。 "],
    "임시 동료가 필요합니다. ": ["Requires a temporary ally. ", "臨時の仲間が必要。 "],
    "오염 통, 기폭제 또는 앞 슬롯의 정화탄 폭발로 발동합니다. ": ["Triggered by a barrel, catalyst or an earlier slot’s bomb explosion. ", "汚染樽、起爆剤、または前のスロットの浄化弾の爆発で発動。 "],
    " 피해 ": [" Damage ", " ダメージ "],
    " · 반경 ": [" · Radius ", " · 半径 "],
    " · 재사용 ": [" · Cooldown ", " · 再使用 "],
    "초 · 발동 ": ["s · Activations ", "秒 · 発動 "],
    "회": [" times", "回"],
    "조건": ["Trigger", "条件"],
    "효과": ["Effect", "効果"],
    "개조": ["Modifier", "改造"],
    "빗살 추가 사거리": ["Bonus sweep range", "掃撃の追加射程"],
    "공명 피해": ["Resonance damage", "共鳴ダメージ"],
    "기폭제 피해": ["Catalyst damage", "起爆剤ダメージ"],
    "Lv.4에서 두 번째 슬롯 개방 · ": ["Second slot unlocks at Lv.4 · ", "Lv.4で第2スロット解放 · "],
    "청소 도구를 강화하세요": ["Upgrade your cleaning gear", "清掃道具を強化"],
    "두 번째 조합 슬롯 개방! 장비 칸에서 두 조합을 편집하세요.": ["Second combo slot unlocked! Edit both combos in your equipment panel.", "第2スロット解放！ 装備欄で両方のコンボを編集できます。"],
    "하나를 선택하면 탐험을 이어갑니다.": ["Choose an upgrade to continue.", "1つ選んで探索を続けましょう。"],
    "화들짝! 몬스터가 겁에 질렸습니다": ["Startled! A monster is frightened.", "魔物がおびえている！"],
    "모든 방 정화 완료": ["All rooms cleansed", "全室浄化完了"],
    " 정화 완료 · 체력 +1": [" cleansed · HP +1", " 浄化完了 · HP +1"],
    "기폭제": ["Catalyst", "起爆剤"],
    "폭파 의뢰 완료 · 경험치 +10": ["Demolition contract complete · XP +10", "爆破依頼達成 · 経験値 +10"],
    "오염 통": ["Tainted Barrel", "汚染樽"],
    "빗질": ["Sweep", "掃撃"],
    "자정의 종지기 정화 완료": ["Midnight Bellkeeper cleansed", "真夜中の鐘守を浄化"],
    "하드모드가 열렸습니다.": ["Hard mode unlocked.", "ハードモードが解放されました。"],
    "제목 화면": ["Title screen", "タイトル画面"],
    "황혼의 종지기 정화 완료": ["Dusk Bellkeeper cleansed", "黄昏の鐘守を浄化"],
    "임시 동료 합류 · 이 구역의 정화를 돕습니다": ["Temporary ally recruited · Helps cleanse this area", "臨時の仲間が加入 · このエリアの浄化を手伝います"],
    "샘물 부적이 피해를 막았습니다": ["The spring charm blocked the hit.", "泉のお守りがダメージを防いだ。"],
    "마을에 밤이 남았습니다": ["Night still lingers in the village", "村にはまだ夜が残る"],
    " · 처치 ": [" · Kills ", " · 撃破 "],
    "캐릭터 다시 선택": ["Choose another janitor", "キャラクターを選び直す"],
    "같은 던전 다시 도전": ["Retry this dungeon", "同じダンジョンに再挑戦"],
    "공명": ["Resonance", "共鳴"],
    "정화 파동": ["Cleansing Wave", "浄化波動"],
    "비눗방울": ["Bubble", "シャボン玉"],
    "동료": ["Ally", "仲間"],
    "반딧불 꽃가루 · 체력 회복": ["Firefly pollen · HP restored", "蛍の花粉 · HP回復"],
    "분무기": ["Sprayer", "霧吹き"],
    "오프라인 준비 실패": ["Offline setup failed", "オフラインの準備に失敗"],
    "현재 브라우저에서 전체 화면을 사용할 수 없습니다": ["Fullscreen is unavailable in this browser.", "このブラウザでは全画面表示を利用できません。"],
    "전체 화면 끄기": ["Exit fullscreen", "全画面表示を解除"],
    "전체 화면 켜기": ["Enter fullscreen", "全画面表示"],
    "달안개 광장": ["Moonmist Plaza", "月霧広場"],
    "잠든 과수원": ["Sleeping Orchard", "眠れる果樹園"],
    "달빛 묘지": ["Moonlit Cemetery", "月光の墓地"],
    "침묵의 예배당": ["Silent Chapel", "静寂の礼拝堂"],
    "무너진 상점가": ["Ruined Market", "崩れた商店街"],
    "달안개 마을": ["Moonmist Village", "月霧村"],
    "황혼 서고": ["Dusk Library", "黄昏の書庫"],
    "대출 홀": ["Lending Hall", "貸出ホール"],
    "서쪽 서가": ["West Stacks", "西の書架"],
    "제본실": ["Bindery", "製本室"],
    "필사실": ["Scriptorium", "写本室"],
    "기록 보관소": ["Archive", "記録保管庫"],
    "물비늘 포구": ["Shimmerport", "水光の港"],
    "나루 광장": ["Ferry Plaza", "渡し場広場"],
    "그물 시장": ["Net Market", "網市場"],
    "염전 길": ["Salt Road", "塩田の道"],
    "등대 언덕": ["Lighthouse Hill", "灯台の丘"],
    "뱃사공 골목": ["Boatman's Alley", "船頭横丁"],
    "잿불 주조소": ["Ember Foundry", "残り火の鋳造所"],
    "반입 홀": ["Receiving Hall", "搬入ホール"],
    "용광로실": ["Furnace Room", "溶鉱炉室"],
    "단조 작업장": ["Forge", "鍛造工房"],
    "냉각실": ["Cooling Room", "冷却室"],
    "주물 창고": ["Casting Storehouse", "鋳物倉庫"],
    "은버들": ["Silverwillow", "銀柳"],
    "잔별": ["Starling", "小星"],
    "여울": ["Shallows", "浅瀬"],
    "이슬": ["Dewdrop", "朝露"],
    "솔바람": ["Pinewind", "松風"],
    "노을": ["Sunset", "夕映え"],
    "초승달": ["Crescent", "三日月"],
    "흰자작": ["Whitebirch", "白樺"],
    "마을": ["Village", "村"],
    "문서관": ["Archive", "文書館"],
    "나루": ["Landing", "渡し場"],
    "제련소": ["Smelter", "製錬所"],
    "황혼의 청소부 · Dusk Janitor": ["Dusk Janitor", "黄昏の清掃員 · Dusk Janitor"],
    "쓱싹 대작전 던전. 방향키 또는 WASD로 이동하고, 스페이스바나 마우스 클릭으로 주 무기로 공격하세요. Shift로 회피합니다.": ["Operation Clean Sweep dungeon. Move with the arrow keys or WASD, swing with Space or click, and dodge with Shift.", "おそうじ大作戦。矢印キーまたはWASDで移動、スペースまたはクリックで掃撃、Shiftで回避。"],
    "생존 시간": ["Survival time", "生存時間"],
    "게임 설정": ["Game settings", "ゲーム設定"],
    "던전 지도": ["Dungeon map", "ダンジョンマップ"],
    "탐험한 방과 통로를 표시하는 지도": ["Map of explored rooms and passages", "探索済みの部屋と通路の地図"],
    "처치": ["Kills", "撃破"],
    "카드 손패 (C)": ["Card hand (C)", "手札 (C)"],
    "카드 0": ["Cards 0", "カード 0"],
    "전투 상태": ["Combat status", "戦闘状態"],
    " 이동": [" Move", " 移動"],
    " 회피": [" Dodge", " 回避"],
    "SPACE / 클릭": ["SPACE / Click", "SPACE / クリック"],
    " 빗자루 공격": [" Sweep", " 掃撃"],
    "내 빌드 · 조합 작업실": ["My build · Combo Workshop", "装備構成 · コンボ工房"],
    "조합 작업실 (B)": ["Combo Workshop (B)", "コンボ工房 (B)"],
    "경험치": ["XP", "経験値"],
    "이동 조이스틱": ["Movement joystick", "移動スティック"],
    "회피": ["Dodge", "回避"],
    "공격": ["Attack", "攻撃"]
  };
  let locale = 'ko';
  try {
    const saved = localStorage.getItem('dusk-language');
    if (Object.hasOwn(names, saved)) locale = saved;
  } catch { /* Language selection still works for this session. */ }

  // HUD lines combine labels, counts and timers. Match longer phrases first.
  const escaped = Object.keys(messages).sort((a, b) => b.length - a.length)
    .map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const phrases = new RegExp(escaped.join('|'), 'g');
  function translate(source) {
    if (locale === 'ko') return source;
    if (locale === 'en') source = source.replace(/(\d+)구역 · /, 'Area $1 · ');
    const column = locale === 'en' ? 0 : 1;
    return messages[source]?.[column] ?? source.replace(phrases, key => messages[key][column]);
  }

  const originals = new WeakMap();
  function bind(node, property, source) {
    let fields = originals.get(node);
    if (!fields) originals.set(node, fields = new Map());
    if (fields.get(property) === source) return;
    fields.set(property, source);
    render(node, property, source);
  }
  function render(node, property, source) {
    const value = translate(source);
    if (property === 'text') node.textContent = value;
    else node.setAttribute(property, value);
  }
  function refresh(node) {
    for (const [property, source] of originals.get(node) || []) render(node, property, source);
  }

  document.documentElement.lang = locale;
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (/[가-힣]/.test(node.data)) bind(node, 'text', node.data);
  }
  for (const node of document.querySelectorAll('[aria-label], [title]')) {
    for (const attr of ['aria-label', 'title']) {
      if (node.hasAttribute(attr)) bind(node, attr, node.getAttribute(attr));
    }
  }

  function selector() {
    const label = document.createElement('label');
    label.className = 'language-choice';
    const caption = document.createElement('span');
    const captions = { ko: '언어', ja: '言語', en: 'Language' };
    caption.textContent = captions[locale];
    const select = document.createElement('select');
    for (const [code, name] of Object.entries(names)) {
      const option = new Option(name, code);
      option.lang = code;
      select.add(option);
    }
    select.value = locale;
    select.onchange = () => {
      locale = select.value;
      document.documentElement.lang = locale;
      try { localStorage.setItem('dusk-language', locale); } catch {}
      const tree = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ALL);
      while (tree.nextNode()) refresh(tree.currentNode);
      caption.textContent = captions[locale];
    };
    label.append(caption, select);
    return label;
  }
  return { translate, bind, selector };
})();
