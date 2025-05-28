function isReqQueryVaild(req_list){
    let result = 1;
    req_list.forEach(query => {
        if(typeof query === 'undefined')
            return result = 0;
    });
    return result;
}

function isSelQueryVaild(sel_list){
    let result = 0;
    sel_list.forEach(query => {
        if(typeof query !== 'undefined')
            return result = 1;
    });
    return result;
}

function isQueryVaild(req_list, sel_list){
    if(typeof sel_list !== 'undefined')
        return isReqQueryVaild(req_list) && isSelQueryVaild(sel_list);
    else
        return isReqQueryVaild(req_list);
}

function getClientIpAddress(req){
    return req.headers['x-real-ip'] || req.connection.remoteAddress;
}
  

module.exports = {
    isQueryVaild : isQueryVaild,
    getClientIpAddress : getClientIpAddress,
};