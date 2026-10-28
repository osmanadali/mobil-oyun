const olc = require('./olc.cjs'), F = require('./nehir.cjs');
for (const T of [1, 2]) olc(`Nehir T=${T}`, F({ T }), { river: T }, { T: 100 });
