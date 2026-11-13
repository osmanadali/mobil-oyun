// Dil: kayıtlı seçim (bsudoku_lang) yoksa cihaz dili; desteklenmeyen dil → İngilizce.
// Kullanım: T('anahtar', ...argümanlar) · HTML: data-t="anahtar" (yazı), data-th="anahtar" (HTML), data-ta="anahtar" (aria-label)
(() => {
  const D = {
    tr: {
      t1: 'Büyülü', t2: 'Sudoku', tag: 'Kutucuğa dokun, yaratığını çağır!', kolay: 'Kolay', orta: 'Orta', zor: 'Zor',
      cont: 'Devam Et', how: 'Nasıl Oynanır?', back: 'Menü', undo: 'Geri', erase: 'Sil', hint: 'İpucu', view: 'Görünüm',
      music: 'Müzik', sfx: 'Efekt', off: 'Kapalı', winT: 'Büyü Tamamlandı!', loseT: 'Büyü Bozuldu…', again: 'Yeni Bulmaca', menu: 'Menü',
      howT: '📜 Büyü Kitabı',
      h1: 'Boş kutucuğa <b>1 kez</b> dokun → <b>1</b>, <b>8 kez</b> dokun → <b>8</b>. Her rakam farklı bir yaratık ve büyü çağırır!',
      h2: "9'dan sonra bir dokunuş daha kutuyu boşaltır. Basılı tutmak da siler.",
      h3: 'Her satır, sütun ve 3×3 kutuda 1–9 birer kez olmalı.',
      h4: 'Yanlış rakam bir süre sonra kırmızı yanar ve bir kalp gider. 3 kalp biterse büyü bozulur!',
      h5: 'Satır, sütun ya da kutu tamamlayınca dalga büyüsü patlar. 🎆', gotIt: 'Anladım!',
      names: ['Ejder', 'Peri', 'Balçık Kral', 'Tek Boynuz', 'Baykuş Büyücü', 'Kristal Golem', 'Anka', 'Mantar Cini', 'Yıldız Ruhu'],
      wrong: 'Yanlış büyü! 💔', praise: ['Harika! ✨', 'Süper büyü! 🌟', 'Muhteşem! 🔥', 'Efsane! 🐉'],
      noUndo: 'Geri alınacak yok', viewC: 'Yaratık görünümü 🐾', viewN: 'Rakam görünümü 🔢',
      sfxOnly: 'Sadece efektler 🔔', soundOff: 'Ses kapalı 🔇', musicOn: 'Müzik açık 🎵',
      winTxt: '{0} · {1} · {2} hata', loseTxt: '3 kalbin de gitti. Yaratıklar bir dahaki sefere bekliyor!',
      won: '🏆 {0} büyü tamamlandı', best: '⏱ En iyi: ',
      adT: 'İpucu kalmadı 🪄', adTxt: 'Kısa bir video izle, <b>+2 ipucu</b> kazan!', watch: '🎬 İzle', cancel: 'Vazgeç',
      noAd: 'Şu an video yok, sonra dene', gotHints: '+2 ipucu! 🪄', noHint: 'İpucu kalmadı 🪄', privacy: 'Reklam gizlilik seçenekleri', lang: 'Dil'
    },
    en: {
      t1: 'Magic', t2: 'Sudoku', tag: 'Tap a cell, summon your creature!', kolay: 'Easy', orta: 'Medium', zor: 'Hard',
      cont: 'Continue', how: 'How to Play', back: 'Menu', undo: 'Undo', erase: 'Erase', hint: 'Hint', view: 'View',
      music: 'Music', sfx: 'Effects', off: 'Off', winT: 'Spell Complete!', loseT: 'Spell Broken…', again: 'New Puzzle', menu: 'Menu',
      howT: '📜 Spellbook',
      h1: 'Tap an empty cell <b>once</b> → <b>1</b>, tap it <b>8 times</b> → <b>8</b>. Every number summons a different creature and spell!',
      h2: 'One more tap after 9 clears the cell. Press and hold to erase, too.',
      h3: 'Each row, column and 3×3 box must contain 1–9 exactly once.',
      h4: 'A wrong number glows red after a moment and costs a heart. Lose all 3 hearts and the spell breaks!',
      h5: 'Complete a row, column or box to set off a wave spell. 🎆', gotIt: 'Got it!',
      names: ['Dragon', 'Fairy', 'Slime King', 'Unicorn', 'Owl Wizard', 'Crystal Golem', 'Phoenix', 'Mushroom Sprite', 'Star Spirit'],
      wrong: 'Wrong spell! 💔', praise: ['Great! ✨', 'Super spell! 🌟', 'Amazing! 🔥', 'Legendary! 🐉'],
      noUndo: 'Nothing to undo', viewC: 'Creature view 🐾', viewN: 'Number view 🔢',
      sfxOnly: 'Effects only 🔔', soundOff: 'Sound off 🔇', musicOn: 'Music on 🎵',
      winTxt: '{0} · {1} · {2} mistakes', loseTxt: 'All 3 hearts are gone. The creatures will wait for next time!',
      won: '🏆 {0} spells completed', best: '⏱ Best: ',
      adT: 'Out of hints 🪄', adTxt: 'Watch a short video to get <b>+2 hints</b>!', watch: '🎬 Watch', cancel: 'Not now',
      noAd: 'No video right now, try again later', gotHints: '+2 hints! 🪄', noHint: 'Out of hints 🪄', privacy: 'Ad privacy options', lang: 'Language'
    },
    de: {
      t1: 'Magisches', t2: 'Sudoku', tag: 'Tippe ein Feld an und rufe dein Wesen!', kolay: 'Leicht', orta: 'Mittel', zor: 'Schwer',
      cont: 'Weiterspielen', how: 'Spielanleitung', back: 'Menü', undo: 'Zurück', erase: 'Löschen', hint: 'Tipp', view: 'Ansicht',
      music: 'Musik', sfx: 'Effekte', off: 'Aus', winT: 'Zauber vollendet!', loseT: 'Zauber gebrochen…', again: 'Neues Rätsel', menu: 'Menü',
      howT: '📜 Zauberbuch',
      h1: 'Tippe ein leeres Feld <b>einmal</b> an → <b>1</b>, <b>8-mal</b> → <b>8</b>. Jede Zahl ruft ein anderes Wesen und einen anderen Zauber!',
      h2: 'Ein weiterer Tipp nach der 9 leert das Feld. Gedrückt halten löscht ebenfalls.',
      h3: 'Jede Zeile, Spalte und jedes 3×3-Feld enthält 1–9 genau einmal.',
      h4: 'Eine falsche Zahl leuchtet kurz darauf rot und kostet ein Herz. Sind alle 3 Herzen weg, ist der Zauber gebrochen!',
      h5: 'Vervollständige eine Zeile, Spalte oder ein Feld für einen Wellenzauber. 🎆', gotIt: 'Verstanden!',
      names: ['Drache', 'Fee', 'Schleimkönig', 'Einhorn', 'Eulenmagier', 'Kristallgolem', 'Phönix', 'Pilzgeist', 'Sternengeist'],
      wrong: 'Falscher Zauber! 💔', praise: ['Toll! ✨', 'Super Zauber! 🌟', 'Großartig! 🔥', 'Legendär! 🐉'],
      noUndo: 'Nichts zum Zurücknehmen', viewC: 'Wesen-Ansicht 🐾', viewN: 'Zahlen-Ansicht 🔢',
      sfxOnly: 'Nur Effekte 🔔', soundOff: 'Ton aus 🔇', musicOn: 'Musik an 🎵',
      winTxt: '{0} · {1} · {2} Fehler', loseTxt: 'Alle 3 Herzen sind weg. Die Wesen warten auf das nächste Mal!',
      won: '🏆 {0} Zauber vollendet', best: '⏱ Bestzeit: ',
      adT: 'Keine Tipps mehr 🪄', adTxt: 'Sieh dir ein kurzes Video an und erhalte <b>+2 Tipps</b>!', watch: '🎬 Ansehen', cancel: 'Nicht jetzt',
      noAd: 'Gerade kein Video, versuch es später', gotHints: '+2 Tipps! 🪄', noHint: 'Keine Tipps mehr 🪄', privacy: 'Datenschutzoptionen für Werbung', lang: 'Sprache'
    },
    es: {
      t1: 'Sudoku', t2: 'Mágico', tag: '¡Toca una casilla e invoca a tu criatura!', kolay: 'Fácil', orta: 'Medio', zor: 'Difícil',
      cont: 'Continuar', how: 'Cómo jugar', back: 'Menú', undo: 'Deshacer', erase: 'Borrar', hint: 'Pista', view: 'Vista',
      music: 'Música', sfx: 'Efectos', off: 'No', winT: '¡Hechizo completado!', loseT: 'Hechizo roto…', again: 'Nuevo sudoku', menu: 'Menú',
      howT: '📜 Libro de hechizos',
      h1: 'Toca una casilla vacía <b>una vez</b> → <b>1</b>, <b>8 veces</b> → <b>8</b>. ¡Cada número invoca una criatura y un hechizo distintos!',
      h2: 'Un toque más después del 9 vacía la casilla. Mantener pulsado también borra.',
      h3: 'Cada fila, columna y cuadro de 3×3 debe tener del 1 al 9 una sola vez.',
      h4: 'Un número incorrecto se ilumina en rojo poco después y cuesta un corazón. ¡Si pierdes los 3, el hechizo se rompe!',
      h5: 'Completa una fila, columna o cuadro para lanzar un hechizo de onda. 🎆', gotIt: '¡Entendido!',
      names: ['Dragón', 'Hada', 'Rey Limo', 'Unicornio', 'Búho Mago', 'Gólem de Cristal', 'Fénix', 'Duende Seta', 'Espíritu Estelar'],
      wrong: '¡Hechizo equivocado! 💔', praise: ['¡Genial! ✨', '¡Súper hechizo! 🌟', '¡Increíble! 🔥', '¡Legendario! 🐉'],
      noUndo: 'Nada que deshacer', viewC: 'Vista de criaturas 🐾', viewN: 'Vista de números 🔢',
      sfxOnly: 'Solo efectos 🔔', soundOff: 'Sonido apagado 🔇', musicOn: 'Música activada 🎵',
      winTxt: '{0} · {1} · {2} errores', loseTxt: 'Se acabaron los 3 corazones. ¡Las criaturas te esperan la próxima vez!',
      won: '🏆 {0} hechizos completados', best: '⏱ Mejor: ',
      adT: 'Sin pistas 🪄', adTxt: '¡Mira un video corto y gana <b>+2 pistas</b>!', watch: '🎬 Ver', cancel: 'Ahora no',
      noAd: 'No hay video ahora, inténtalo más tarde', gotHints: '¡+2 pistas! 🪄', noHint: 'Sin pistas 🪄', privacy: 'Opciones de privacidad de anuncios', lang: 'Idioma'
    },
    'pt-BR': {
      t1: 'Sudoku', t2: 'Mágico', tag: 'Toque numa casa e invoque sua criatura!', kolay: 'Fácil', orta: 'Médio', zor: 'Difícil',
      cont: 'Continuar', how: 'Como jogar', back: 'Menu', undo: 'Desfazer', erase: 'Apagar', hint: 'Dica', view: 'Visual',
      music: 'Música', sfx: 'Efeitos', off: 'Desligado', winT: 'Feitiço completo!', loseT: 'Feitiço quebrado…', again: 'Novo sudoku', menu: 'Menu',
      howT: '📜 Livro de feitiços',
      h1: 'Toque numa casa vazia <b>1 vez</b> → <b>1</b>, <b>8 vezes</b> → <b>8</b>. Cada número invoca uma criatura e um feitiço diferentes!',
      h2: 'Mais um toque depois do 9 esvazia a casa. Segurar também apaga.',
      h3: 'Cada linha, coluna e quadro 3×3 deve ter de 1 a 9 uma única vez.',
      h4: 'Um número errado fica vermelho logo depois e custa um coração. Perdeu os 3, o feitiço se quebra!',
      h5: 'Complete uma linha, coluna ou quadro para soltar um feitiço de onda. 🎆', gotIt: 'Entendi!',
      names: ['Dragão', 'Fada', 'Rei Gosma', 'Unicórnio', 'Coruja Maga', 'Golem de Cristal', 'Fênix', 'Duende Cogumelo', 'Espírito Estelar'],
      wrong: 'Feitiço errado! 💔', praise: ['Ótimo! ✨', 'Superfeitiço! 🌟', 'Incrível! 🔥', 'Lendário! 🐉'],
      noUndo: 'Nada para desfazer', viewC: 'Visual de criaturas 🐾', viewN: 'Visual de números 🔢',
      sfxOnly: 'Só efeitos 🔔', soundOff: 'Som desligado 🔇', musicOn: 'Música ligada 🎵',
      winTxt: '{0} · {1} · {2} erros', loseTxt: 'Os 3 corações acabaram. As criaturas esperam por você na próxima!',
      won: '🏆 {0} feitiços completos', best: '⏱ Melhor: ',
      adT: 'Sem dicas 🪄', adTxt: 'Assista a um vídeo curto e ganhe <b>+2 dicas</b>!', watch: '🎬 Assistir', cancel: 'Agora não',
      noAd: 'Sem vídeo agora, tente mais tarde', gotHints: '+2 dicas! 🪄', noHint: 'Sem dicas 🪄', privacy: 'Opções de privacidade de anúncios', lang: 'Idioma'
    },
    fr: {
      t1: 'Sudoku', t2: 'Magique', tag: 'Touche une case, invoque ta créature !', kolay: 'Facile', orta: 'Moyen', zor: 'Difficile',
      cont: 'Continuer', how: 'Comment jouer', back: 'Menu', undo: 'Annuler', erase: 'Effacer', hint: 'Indice', view: 'Affichage',
      music: 'Musique', sfx: 'Effets', off: 'Coupé', winT: 'Sort accompli !', loseT: 'Sort brisé…', again: 'Nouvelle grille', menu: 'Menu',
      howT: '📜 Grimoire',
      h1: 'Touche une case vide <b>1 fois</b> → <b>1</b>, <b>8 fois</b> → <b>8</b>. Chaque chiffre invoque une créature et un sort différents !',
      h2: 'Une touche de plus après le 9 vide la case. Un appui long efface aussi.',
      h3: 'Chaque ligne, colonne et carré 3×3 contient 1 à 9 une seule fois.',
      h4: 'Un chiffre faux s’allume en rouge peu après et coûte un cœur. Sans tes 3 cœurs, le sort est brisé !',
      h5: 'Complète une ligne, une colonne ou un carré pour déclencher un sort en vague. 🎆', gotIt: 'Compris !',
      names: ['Dragon', 'Fée', 'Roi Gluant', 'Licorne', 'Hibou Mage', 'Golem de Cristal', 'Phénix', 'Lutin Champignon', 'Esprit Étoile'],
      wrong: 'Mauvais sort ! 💔', praise: ['Bravo ! ✨', 'Super sort ! 🌟', 'Génial ! 🔥', 'Légendaire ! 🐉'],
      noUndo: 'Rien à annuler', viewC: 'Affichage créatures 🐾', viewN: 'Affichage chiffres 🔢',
      sfxOnly: 'Effets seulement 🔔', soundOff: 'Son coupé 🔇', musicOn: 'Musique activée 🎵',
      winTxt: '{0} · {1} · {2} erreurs', loseTxt: 'Tes 3 cœurs sont perdus. Les créatures t’attendent la prochaine fois !',
      won: '🏆 {0} sorts accomplis', best: '⏱ Record : ',
      adT: 'Plus d’indices 🪄', adTxt: 'Regarde une courte vidéo pour gagner <b>+2 indices</b> !', watch: '🎬 Regarder', cancel: 'Plus tard',
      noAd: 'Pas de vidéo pour l’instant, réessaie plus tard', gotHints: '+2 indices ! 🪄', noHint: 'Plus d’indices 🪄', privacy: 'Options de confidentialité des annonces', lang: 'Langue'
    },
    ko: {
      t1: '마법의', t2: '스도쿠', tag: '칸을 눌러 크리처를 소환하세요!', kolay: '쉬움', orta: '보통', zor: '어려움',
      cont: '이어하기', how: '게임 방법', back: '메뉴', undo: '되돌리기', erase: '지우기', hint: '힌트', view: '보기',
      music: '음악', sfx: '효과음', off: '끔', winT: '마법 완성!', loseT: '마법이 깨졌어요…', again: '새 퍼즐', menu: '메뉴',
      howT: '📜 마법서',
      h1: '빈 칸을 <b>1번</b> 누르면 <b>1</b>, <b>8번</b> 누르면 <b>8</b>. 숫자마다 다른 크리처와 마법이 나타나요!',
      h2: '9 다음에 한 번 더 누르면 칸이 비워져요. 길게 눌러도 지워져요.',
      h3: '모든 가로줄, 세로줄, 3×3 칸에 1–9가 한 번씩 들어가야 해요.',
      h4: '틀린 숫자는 잠시 후 빨갛게 빛나고 하트 하나가 사라져요. 하트 3개를 모두 잃으면 마법이 깨져요!',
      h5: '가로줄, 세로줄, 칸을 완성하면 물결 마법이 터져요. 🎆', gotIt: '알겠어요!',
      names: ['드래곤', '요정', '슬라임 왕', '유니콘', '부엉이 마법사', '크리스탈 골렘', '불사조', '버섯 요정', '별의 정령'],
      wrong: '잘못된 마법! 💔', praise: ['멋져요! ✨', '최고의 마법! 🌟', '굉장해요! 🔥', '전설이에요! 🐉'],
      noUndo: '되돌릴 것이 없어요', viewC: '크리처 보기 🐾', viewN: '숫자 보기 🔢',
      sfxOnly: '효과음만 🔔', soundOff: '소리 끔 🔇', musicOn: '음악 켬 🎵',
      winTxt: '{0} · {1} · 실수 {2}번', loseTxt: '하트 3개를 모두 잃었어요. 크리처들이 다음을 기다려요!',
      won: '🏆 마법 {0}개 완성', best: '⏱ 최고 기록: ',
      adT: '힌트가 없어요 🪄', adTxt: '짧은 영상을 보고 <b>힌트 +2</b>를 받으세요!', watch: '🎬 보기', cancel: '나중에',
      noAd: '지금은 영상이 없어요. 나중에 다시 시도하세요', gotHints: '힌트 +2! 🪄', noHint: '힌트가 없어요 🪄', privacy: '광고 개인정보 보호 옵션', lang: '언어'
    },
    ja: {
      t1: 'まほうの', t2: 'ナンプレ', tag: 'マスをタップしてモンスターを呼び出そう！', kolay: 'かんたん', orta: 'ふつう', zor: 'むずかしい',
      cont: 'つづきから', how: 'あそびかた', back: 'メニュー', undo: '戻す', erase: '消す', hint: 'ヒント', view: '表示',
      music: '音楽', sfx: '効果音', off: 'オフ', winT: '魔法完成！', loseT: '魔法がとけた…', again: '新しいパズル', menu: 'メニュー',
      howT: '📜 魔法の書',
      h1: '空いているマスを<b>1回</b>タップ → <b>1</b>、<b>8回</b>タップ → <b>8</b>。数字ごとにちがうモンスターと魔法が登場！',
      h2: '9のあとにもう1回タップするとマスが空になります。長押しでも消せます。',
      h3: 'どの行・列・3×3のブロックにも1〜9が1つずつ入ります。',
      h4: 'まちがった数字は少しすると赤く光り、ハートが1つ減ります。ハート3つがなくなると魔法がとけてしまいます！',
      h5: '行・列・ブロックをそろえると波の魔法が発動！ 🎆', gotIt: 'わかった！',
      names: ['ドラゴン', '妖精', 'スライムキング', 'ユニコーン', 'フクロウ魔法使い', 'クリスタルゴーレム', 'フェニックス', 'キノコの精', '星の精霊'],
      wrong: 'まちがった魔法！ 💔', praise: ['すごい！ ✨', 'スーパー魔法！ 🌟', 'みごと！ 🔥', '伝説級！ 🐉'],
      noUndo: '戻せる手はありません', viewC: 'モンスター表示 🐾', viewN: '数字表示 🔢',
      sfxOnly: '効果音のみ 🔔', soundOff: 'サウンドオフ 🔇', musicOn: '音楽オン 🎵',
      winTxt: '{0} · {1} · ミス{2}回', loseTxt: 'ハートが3つともなくなりました。モンスターたちが次を待っています！',
      won: '🏆 魔法を{0}回完成', best: '⏱ ベスト: ',
      adT: 'ヒントがありません 🪄', adTxt: '短い動画を見て<b>ヒント+2</b>をもらおう！', watch: '🎬 見る', cancel: 'あとで',
      noAd: 'いまは動画がありません。あとで試してください', gotHints: 'ヒント+2！ 🪄', noHint: 'ヒントがありません 🪄', privacy: '広告のプライバシー設定', lang: '言語'
    },
    'zh-Hant': {
      t1: '魔法', t2: '數獨', tag: '點一下格子，召喚你的魔物！', kolay: '簡單', orta: '普通', zor: '困難',
      cont: '繼續', how: '玩法說明', back: '選單', undo: '復原', erase: '清除', hint: '提示', view: '顯示',
      music: '音樂', sfx: '音效', off: '關閉', winT: '魔法完成！', loseT: '魔法失效了…', again: '新題目', menu: '選單',
      howT: '📜 魔法書',
      h1: '空格點 <b>1 下</b> → <b>1</b>，點 <b>8 下</b> → <b>8</b>。每個數字都會召喚不同的魔物和魔法！',
      h2: '在 9 之後再點一下就會清空格子。長按也能清除。',
      h3: '每一列、每一行和每個 3×3 宮格中，1–9 都只能出現一次。',
      h4: '填錯的數字會在片刻後亮紅光，並失去一顆愛心。3 顆愛心都沒了，魔法就會失效！',
      h5: '完成一列、一行或一個宮格，就會引發波浪魔法。🎆', gotIt: '知道了！',
      names: ['飛龍', '小仙子', '史萊姆國王', '獨角獸', '貓頭鷹巫師', '水晶魔像', '鳳凰', '蘑菇精靈', '星星精靈'],
      wrong: '魔法錯了！💔', praise: ['太棒了！✨', '超級魔法！🌟', '好厲害！🔥', '傳奇！🐉'],
      noUndo: '沒有可以復原的步驟', viewC: '魔物顯示 🐾', viewN: '數字顯示 🔢',
      sfxOnly: '只有音效 🔔', soundOff: '聲音關閉 🔇', musicOn: '音樂開啟 🎵',
      winTxt: '{0} · {1} · 錯誤 {2} 次', loseTxt: '3 顆愛心都沒了。魔物們等你下次再來！',
      won: '🏆 已完成 {0} 個魔法', best: '⏱ 最佳：',
      adT: '提示用完了 🪄', adTxt: '看一段短片，獲得 <b>+2 提示</b>！', watch: '🎬 觀看', cancel: '先不要',
      noAd: '目前沒有影片，請稍後再試', gotHints: '+2 提示！🪄', noHint: '提示用完了 🪄', privacy: '廣告隱私選項', lang: '語言'
    }
  };
  const LANGS = [['tr', 'Türkçe'], ['en', 'English'], ['de', 'Deutsch'], ['es', 'Español'], ['pt-BR', 'Português'], ['fr', 'Français'], ['ko', '한국어'], ['ja', '日本語'], ['zh-Hant', '繁體中文']];
  let saved = null; try { saved = JSON.parse(localStorage.getItem('bsudoku_lang')); } catch {}
  const dev = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
  const fromDev = dev.startsWith('tr') ? 'tr' : dev.startsWith('de') ? 'de' : dev.startsWith('es') ? 'es' : dev.startsWith('pt') ? 'pt-BR'
    : dev.startsWith('fr') ? 'fr' : dev.startsWith('ko') ? 'ko' : dev.startsWith('ja') ? 'ja' : /^zh-(hant|tw|hk|mo)\b/.test(dev) ? 'zh-Hant' : 'en';
  const lang = D[saved] ? saved : fromDev;
  document.documentElement.lang = lang;
  const S = D[lang];
  window.LANG = lang; window.LANGS = LANGS;
  window.T = (k, ...a) => { const v = S[k] ?? D.en[k] ?? k; return typeof v === 'string' ? v.replace(/\{(\d)\}/g, (_, i) => a[i]) : v; };
  window.setLang = l => { try { localStorage.setItem('bsudoku_lang', JSON.stringify(l)); } catch {} location.reload(); };
  window.applyI18n = () => {
    document.querySelectorAll('[data-t]').forEach(e => e.textContent = T(e.dataset.t));
    document.querySelectorAll('[data-th]').forEach(e => e.innerHTML = T(e.dataset.th));
    document.querySelectorAll('[data-ta]').forEach(e => e.setAttribute('aria-label', T(e.dataset.ta)));
    document.title = T('t1') + ' ' + T('t2');
  };
})();
