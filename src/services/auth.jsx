export const login = async (email, password) => {
  if (email === "getblackvision.br@gmail.com" && password === "Rihanna26") {
    const token = "fake-jwt-token";
    localStorage.setItem("token", token);
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};