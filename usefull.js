module.exports = {
    validatePhoneNumber: (number) => {
        // remove whitespace
        number = number.replace(/ /gi, '');
        // remove (-)
        number = number.replace(/-/gi, '');

        // if dont have cuntry code add poland code
        if (!number.includes("+"))
            number = '+48' + number;

        return number;
    },
}