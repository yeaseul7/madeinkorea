export const seoLocales = { en: { region:'en-US', og:'en_US' }, ja: { region:'ja-JP', og:'ja_JP' }, ko: { region:'ko-KR', og:'ko_KR' } } as const;
export const seoPages = {
 en: {
  home: ['Korean Jindo Dog: History & Adoption | Jindo of Korea', 'Meet the Korean Jindo, a native dog from Jindo Island, South Korea. Explore its history, the story of Baekgu, adoption listings and Jinjin games.'],
  history: ['Korean Jindo History & Origins | Jindo of Korea', 'Explore the Korean Jindo’s island origins, its 1938 designation and protection after liberation. Read historical context with links to Korean archival sources.'],
  games: ['Jinjin Games: Korean Jindo Dog Games | Jindo of Korea', 'Explore playful Korean Jindo games starring Jinjin. Play Catch Jinjin in a traditional Korean courtyard and discover the Jindo through play.'],
  catch: ['Catch Jinjin: Free Jindo Dog Browser Game | Jindo of Korea', 'Find Jinjin among white, golden and black Jindo pups in a 30-second browser game. Tap the right pup, build combos and earn points. No download needed.'],
 },
 ja: {
  home: ['珍島犬（チンド犬）の歴史と里親情報 | Jindo of Korea', '韓国・珍島生まれの在来犬、珍島犬を紹介。犬種の歴史や帰ってきた白狗の物語、里親募集情報、ジンジンのゲームをご覧いただけます。'],
  history: ['珍島犬の歴史と起源・天然記念物指定 | Jindo of Korea', '珍島犬の起源、1938年の指定、解放後の保護制度をたどります。韓国の公的資料と学術解説の出典を示して紹介します。'],
  games: ['ジンジンゲーム・珍島犬と遊ぼう | Jindo of Korea', '珍島犬のジンジンと楽しむブラウザゲーム。韓国の田舎の庭を舞台に、壺から現れるジンジンを見つけましょう。'],
  catch: ['ジンジンキャッチ・無料ブラウザゲーム | Jindo of Korea', '白犬・黄犬・黒犬の中からジンジンを探してタップ。30秒の制限時間でコンボと高得点を目指す、ダウンロード不要のゲームです。'],
 },
 ko: {
  home: ['진돗개 이야기와 입양 정보 | JINDO OF KOREA', '한국의 토종견 진돗개를 만나보세요. 진도에서 시작된 역사와 돌아온 백구 이야기, 국내 입양공고와 진진게임을 소개합니다.'],
  history: ['진돗개의 역사와 기원·천연기념물 지정 | JINDO OF KOREA', '진돗개의 기원부터 1938년 천연기념물 지정과 해방 이후 보호 제도까지. 공공 기록과 학술 해설을 출처와 함께 읽는 진돗개 역사 아카이브입니다.'],
  games: ['진진게임·진돗개와 즐기는 미니게임 | JINDO OF KOREA', '진돗개 캐릭터 진진이와 즐기는 브라우저 미니게임. 한국 시골 마당의 항아리에서 나오는 진진이를 찾으며 가볍게 플레이해 보세요.'],
  catch: ['진진잡기·무료 진돗개 브라우저 게임 | JINDO OF KOREA', '항아리에서 나오는 진진이를 찾아 터치하세요. 백구·황구·흑구를 구별하고 콤보를 쌓는 30초 미니게임. 설치 없이 PC와 모바일에서 플레이할 수 있습니다.'],
 }
} as const;
export const seoRoutes = ['', 'history/', 'games/', 'games/catch/'] as const;
