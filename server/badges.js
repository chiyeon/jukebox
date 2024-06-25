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
      "teal"
    ),
    monthofmay2: Badge(
      "monthofmay2",
      "MONTH OF MAY 2",
      "Month of May 2 event participant",
      "today",
      "brown"
    ),
    renewer: Badge(
      "renewer",
      "RENEWER",
      "RENEWAL event participant",
      "raven",
      "crimson",
    ),
  },
};
