const code = {
    SALLYFREESHIPPING: "SALLYFREESHIPPING",
    SALLYPERCENTAGE: "SALLYPERCENTAGE",
    SALLYFIXED: "SALLYFIXED",
    SALLYGETYBUYX: 'SALLYGETYBUYX'
};

Object.freeze(code);

class priceRuleHandler {
    constructor(shop_domain, shop_token) {
        this.shop_domain = shop_domain;
        this.shop_token = shop_token;
        this.fetchOption = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': this.shop_token
            },
            credentials: 'include'
        };
    }

    async isDiscountCodeExists(code) {
        console.log(code);
        let retval = await fetch(`https://${this.shop_domain}/admin/discount_codes/lookup.json?code=${code}`, this.fetchOption)
            .then((response) => response.json())
            .catch((err) => console.log(err));

        console.log("return: ", retval);
        return retval.discount_code;
    };
}

module.exports = {priceRuleHandler, code};