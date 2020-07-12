
//<div style="display: flex; justify-content: space-between; padding-bottom: 10px; padding-top: 10px; border-bottom: 2px solid  #eaeaec;">
    
//     <div style="color: #85878E; font-size: 12px;">1989 Penny - 1209309</div>
//     <div style="color: #85878E; font-size: 12px;">$12.98</div>
    
// </div>
  
//    <div style="display: flex; justify-content: space-between; padding-bottom: 10px; padding-top: 10px; border-bottom: 2px solid  #eaeaec;">
    
//     <div style="color: #85878E; font-size: 12px;">1989 Penny - 1209309</div>
//     <div style="color: #85878E; font-size: 12px;">$12.98</div>
    
// </div>
  
//    <div style="display: flex; justify-content: space-between; padding-bottom: 10px; padding-top: 10px; border-bottom: 2px solid  #eaeaec;">
    
//     <div style="color: #85878E; font-size: 12px;">1989 Penny - 1209309</div>
//     <div style="color: #85878E; font-size: 12px;">$12.98</div>
    
// </div>

module.exports = function createReceiptEmail(firstName, items, taxAndShipping, total) {

    var receiptEmailHeader = `<link href=\"https://fonts.googleapis.com/css2?family=Nunito+Sans&display=swap\" rel=\"stylesheet\"><div style=\"margin: auto; padding: 50px; max-width: 670px;\"><h1 style="font-family: 'Nunito Sans', sans-serif; color: black;">Hi ${firstName},</h1><p style=\"font-size: 16px; color: #51545E; font-family: \'Nunito Sans\', sans-serif; margin-bottom: 50px;\">Thanks for purchasing from Willy\'s Penny Co. This email is the confirmation of your purchase. No payment is due.</p><div style=\"display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 2px solid  #eaeaec;\"><div style=\"color: #85878E; font-size: 12px; font-weight: bold;\">Description</div><div style=\"color: #85878E; font-size: 12px; font-weight: bold; margin-left: auto;\">Amount</div></div>`

    let receiptEmailItems = ""

    items.forEach(item => {
        receiptEmailItems += `
            <div style="display: flex; justify-content: space-between; padding-bottom: 10px; padding-top: 10px; border-bottom: 2px solid  #eaeaec;">
    
                <div style="color: #85878E; font-size: 12px;">${item.year} Penny - ${item.name}</div>
                <div style="color: #85878E; font-size: 12px; margin-left: auto;">$${item.price/100}</div>
    
            </div>
        `
    });

    receiptEmailItems += `
    <div style="display: flex; justify-content: space-between; padding-bottom: 10px; padding-top: 10px; border-bottom: 2px solid  #eaeaec;">

        <div style="color: #85878E; font-size: 12px;">Tax and Shipping</div>
        <div style="color: #85878E; font-size: 12px; margin-left: auto;">$${taxAndShipping}</div>

    </div>
`

    var receiptEmailFooter = `<div style=\"display: flex; padding-bottom: 10px; padding-top: 10px;\"><div style=\"margin-left: auto; margin-right: 20px; color: black; font-size: 12px; font-weight: bold;\">Total</div><div style=\"color: black; font-size: 12px; font-weight: bold;\">$${total}</div></div><p style=\"font-size: 16px; color: #51545E; font-family: 'Nunito Sans', sans-serif; margin-top: 50px;\">If you have any questions about this receipt or need help with your order, please email support@willco.com for help.</p></div>`

    return receiptEmailHeader + receiptEmailItems + receiptEmailFooter;

};