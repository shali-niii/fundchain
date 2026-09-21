#include<iostream>
using namespace std;

const long long MOD = 1000000007LL;

long long powerMod(long long base, long long exponent){
    long long result = 1;
    base = base % MOD;

    while(exponent > 0){
        if(exponent % 2 == 1){
            result = (result * base) %MOD;
        }
        base = ( base * base) % MOD;
        exponent = exponent >> 1;
    }
    return result;
}

int main(){
    int n;
    cin>> n;


        cout << powerMod(2,n) << endl;

    return 0;
}