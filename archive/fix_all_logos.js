const fs = require('fs');

const htmlFile = "C:/Users/ASUS/OneDrive/Desktop/PTX Summer Cup 2026-web/PTX Summer Cup 2026 2.4 - Update Version.html";
let content = fs.readFileSync(htmlFile, 'utf8');

const renderLogoFunc = `
        function renderTeamLogo(teamObj, size = '1.2em') {
            if (!teamObj) return '';
            if (teamObj.logo) {
                return \`<img src="\${teamObj.logo}" style="width:\${size}; height:\${size}; object-fit:cover; border-radius:50%; vertical-align:middle; display:inline-block; margin-right:4px;">\`;
            }
            return teamObj.icon || '';
        }
`;

// Insert the function right after const PLAYERS_DATA
content = content.replace(/const PLAYERS_DATA = \[[\s\S]*?\];/m, (match) => {
    return match + "\n" + renderLogoFunc;
});

// Now replace specific instances of .icon with renderTeamLogo(...)
// 5474 & 5476: homeTeam.icon / awayTeam.icon
content = content.replace(/\$\{homeTeam\.icon\}/g, '${renderTeamLogo(homeTeam)}');
content = content.replace(/\$\{awayTeam\.icon\}/g, '${renderTeamLogo(awayTeam)}');

// TEAMS_DATA[homeTeam].icon 
content = content.replace(/\$\{TEAMS_DATA\[homeTeam\]\.icon\}/g, '${renderTeamLogo(TEAMS_DATA[homeTeam])}');
content = content.replace(/\$\{TEAMS_DATA\[awayTeam\]\.icon\}/g, '${renderTeamLogo(TEAMS_DATA[awayTeam])}');

// 5782: team.icon (in map)
content = content.replace(/\$\{team\.icon\}/g, '${renderTeamLogo(team)}');

// 6309 & 6318 & 6707: home.icon / away.icon
content = content.replace(/\$\{home\.icon\}/g, '${renderTeamLogo(home)}');
content = content.replace(/\$\{away\.icon\}/g, '${renderTeamLogo(away)}');
content = content.replace(/\$\{t\.icon\}/g, '${renderTeamLogo(t)}');

// TEAMS_DATA[p.team].icon (if any)
content = content.replace(/\$\{TEAMS_DATA\[p\.team\]\.icon\}/g, '${renderTeamLogo(TEAMS_DATA[p.team])}');

fs.writeFileSync(htmlFile, content, 'utf8');
console.log("Updated team icons to logos successfully!");
