let cookieStore = window.cookieStore;
let cookies = await cookieStore.getAll();
let cookieObj = {};

cookies.forEach(cookie => {
    cookieObj[cookie.name] = cookie.value;
});

let jsonCookies = JSON.stringify(cookieObj);
console.log(jsonCookies);
