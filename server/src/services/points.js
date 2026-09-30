export const POINTS = {
  goal: { GK: 7, DEF: 6, MID: 5, ST: 4 },
  assist: { GK: 3, DEF: 3, MID: 3, ST: 3 },
  cleanSheet: { GK: 4, DEF: 4, MID: 2, ST: 1 },
  bonus: { twoOrMoreGoals: 3, oneGoal: 1 },
};
// enabled = league scoring options, e.g. ['GOALS','ASSISTS']. Bonus only applies when GOALS is enabled.
export function calculatePoints(pos, { goals = 0, assists = 0, cleanSheet = false }, enabled) {
  let p = 0;
  if (enabled.includes('GOALS')) {
    p += goals * POINTS.goal[pos];
    if (goals >= 2) p += POINTS.bonus.twoOrMoreGoals; else if (goals === 1) p += POINTS.bonus.oneGoal;
  }
  if (enabled.includes('ASSISTS')) p += assists * POINTS.assist[pos];
  if (enabled.includes('CLEANSHEETS') && cleanSheet) p += POINTS.cleanSheet[pos];
  return p;
}
