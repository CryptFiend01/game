function httpPost(url, arg) {
    const xhr = new XMLHttpRequest();
    xhr.open('post', url, false); // 第三个参数为是否开启异步请求
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(arg);
    if (xhr.status != 200) {
        return null;
    }
    const result = JSON.parse(xhr.responseText);
    return result;
}