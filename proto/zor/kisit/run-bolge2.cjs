const olc = require('./olc.cjs'), F = require('./bolge2.cjs');
for (const [D, T, showB] of [[1, 1, true], [2, 1, true], [1, 2, true], [2, 2, true], [1, 1, false]]) olc(`Bölge D=${D} T=${T} B ${showB ? 'yazılı' : 'yok'}`, F({ D, T, showB }), { zone: T }, { T: 120 });
