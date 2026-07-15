export const clearAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    sessionStorage.clear();
};

export const getToken = (): string | null => {
    return localStorage.getItem("accessToken");
};
