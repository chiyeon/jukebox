const Badge = (id, name, description, icon, color) => {
  return {
    id,
    name,
    description,
    icon,
    color,
  };
};

module.exports = {
  badges: {
    contributor: Badge(
      "contributor",
      "Contributor",
      "Website contributor",
      "code",
      "lightpink",
    ),
    renewer: Badge(
      "renewer",
      "RENEWER",
      "RENEWAL event participant",
      "raven",
      "crimson",
    ),
    christmas2023: Badge(
      "christmas2023",
      "Christmas Bouncin",
      "Part of the 2023 Christmas Miracle",
      "redeem",
      "green",
    ),
    summer2024_sample: Badge(
      "summer2024_sample",
      "Summer 2024 EP",
      "Used a Summer EP Sample",
      "cookie",
      "darkkhaki"
    ),
    summer2024_tracks: Badge(
      "summer2024_tracks",
      "Summer 2024 EP",
      "Submitted 3+ tracks",
      "cast_pause",
      "rosybrown"
    )
  },
};
