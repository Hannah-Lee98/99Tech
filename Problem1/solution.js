var sum_to_n_a = function(n) {
    let result = 0
    for(let i = 1; i <= n ; i+=1){
        result+=i
    }
    return result
};

var sum_to_n_b = function(n) {
    return n * (n + 1) /2
};

var sum_to_n_c = function(n) {
    let result = n*n
    for(let i = n-1 ; i > 0 ; i-=1){
        result-=i
    }
    return result
};
