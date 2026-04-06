const KEY = "site_content";

export const getContent = () => {
  return JSON.parse(localStorage.getItem(KEY)) || {
    heroTitle: "Seu título aqui",
    heroSubtitle: "Seu subtítulo"
  };
};

export const saveContent = (data) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};