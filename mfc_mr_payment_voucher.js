/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/file', 'N/encode', 'N/email'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{file} file
 * @param{encode} encode
 * @param{email} email
 */
    (record, runtime, search, file, encode, email) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
        try{
            // get parameters
            let scr = runtime.getCurrentScript();
            const PAYMENTARR =  scr.getParameter({name: 'custscript_mfc_payment_data'}); // Array of Payment Data
            const VOUCHER   =   scr.getParameter({name: 'custscript_mfc_voucher_info'});  // Voucher Info
            var payArr = JSON.parse(PAYMENTARR);

            // Create Saved search Filter
            const internalIds = [];
            for (let a = 0; a < payArr.length; a++) {
                internalIds.push(payArr[a].InternalID);
                payArr[a].TransactionArr = [];
            }
            // create search filter
            let payFilter = search.createFilter({
                name: 'internalid',
                join: 'applyingtransaction',
                operator: search.Operator.ANYOF,
                values: internalIds
            });
            
            //load saved search with filter applied
            const eSearch = search.load({id: VOUCHER});
            eSearch.filters.push(payFilter);
            let retArr = [];
            let retObj = {};
            let eResultsPaged = eSearch.runPaged({pageSize: 1000});
            eResultsPaged.pageRanges.forEach(function(pageRange) {
                let ePage = eResultsPaged.fetch({index: pageRange.index});
                ePage.data.forEach(function(res) {
                    // Grab the values corresponding with each column
                    let date = res.getValue(res.columns[0]);
                    let type = res.getValue(res.columns[1]);
                    let documentNum = res.getValue(res.columns[2]);
                    let name = res.getValue(res.columns[3]);
                    let amount = res.getValue(res.columns[4]);
                    let remain = res.getValue(res.columns[5]);
                    let applytrans = res.getValue(res.columns[6]);
                    let linktype = res.getValue(res.columns[7]);
                    let appliedID = res.getValue(res.columns[8]);
                    let index = payArr.find(obj => obj.InternalID === appliedID);
                    // created the corresponding object
                    retObj = {
                        Date: date,
                        Type: type,
                        DocumentNumber: documentNum,
                        Name: name,
                        Amount: amount,
                        AmountRemaining: remain,
                        ApplyingTransaction: applytrans,
                        ApplyingLinkType: linktype,
                        AppliedInternalID: appliedID,
                    };

                    // if index exists
                    if (index) {
                        index.TransactionArr.push(retObj);
                    }

                });
             
            });

            return payArr;

        } catch (e) {
                log.error('Error in Get Input Data Stage', e);
            }

        const isNullOrEmpty = (val) => {
                if (val === null || val === undefined || val === '') {
                    return true;
                } else {
                    return false;
                }
            }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            // Map each payment to own reduce stage
            try {
                var r = JSON.parse(mapContext.value);
                // write value based on internal id
                mapContext.write({
                    key: r.InternalID,
                    value: r
                });
            } catch (e) {
                log.error({
                    title: 'Error Occured in Map stage',
                    details: e
                });
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            try {
                // get parameters
                let scr = runtime.getCurrentScript();
                const ICEMAIL    =  scr.getParameter({name: 'custscript_mfc_ic_addres'});  // IC Address
                const USEREMAIL =   scr.getParameter({name: 'custscript_mfc_email'});  // User Email
                const AUTHOR =      scr.getParameter({name: 'custscript_mfc_email_author'}); // Email Author
                // parse values from map stage
                let mValues = reduceContext.values;
                let vals = [];
                for (let a = 0; a < mValues.length; a++) {
                    let b = JSON.parse(mValues[a]);
                    vals.push(b);
                }
                //log.debug('Vals',vals);
                //log.debug('Val len',vals.length);
                //address for testing
                let address = 'Plano, TX 75075'
                let date = vals.date;
                let amount = vals.amount;
                let checkNum = 1234; // update to desired
                // Get today's date
                const currentDate = new Date().toLocaleDateString();
                // compose email in html
                let htmlTable = `
                    <table>
                    <tr>
                    <td colspan="5" style="text-align: center;">Payment Voucher</td>
                    </tr>
                    <tr style="height: 10px;"></tr> <!-- Space between the title and other rows -->
                    <tr>
                    <td style="text-align: left; padding-right: 60px;">Intellicentrics, Inc.</td>
                    <td style="text-align: right; padding-left: 60px;" colspan="4">Check #: ${checkNum}</td>
                    </tr>
                    <tr>
                    <td style="text-align: left; padding-bottom: 20px;">${address}</td>
                    <td colspan="4" style="text-align: right; padding-bottom: 20px;">Date: ${currentDate}</td>
                    </tr>
                    <tr style="height: 10px;"></tr> <!-- Blank line with fixed height -->
                    <tr>
                    <td colspan="5" style="text-align: left; padding-top: 10px;">Paid To:</td>
                    </tr>
                    <tr>
                    <td colspan="5" style="text-align: left;">Customer Name</td>
                    <tr><td colspan="6">&nbsp;</td></tr>'
                    </tr>
                    </table>
                    `;

                // Construct the HTML table for the payment details
                let htmlTable2 = '<table>';
                htmlTable2 += '<tr>';
                htmlTable2 += '<th>Date</th>';
                htmlTable2 += '<th>Description</th>';
                htmlTable2 += '<th>Orig. Amount</th>';
                htmlTable2 += '<th>Amount Due</th>';
                //htmlTable2 += '<th>Discount</th>';     ***if needed later***
                //htmlTable2 += '<th>Applied Amount</th>';
                htmlTable2 += '</tr>';

                for (let a = 0; a < vals.length; a++) {
                    let payment = vals[a].TransactionArr[a];
                    log.debug('TEST VALS',vals[a].TransactionArr[a]);
                    htmlTable2 += '<tr><td colspan="6">&nbsp;</td></tr>'
                    htmlTable2 += '<tr>';
                    htmlTable2 += `<td>${payment.Date}</td>`;
                    htmlTable2 += `<td>${payment.Type}</td>`;
                    htmlTable2 += `<td>${payment.Amount}</td>`;
                    htmlTable2 += `<td>${payment.AmountRemaining}</td>`;
                    //htmlTable2 += `<td>${payment.Discount}</td>`; ***if needed later***
                    //htmlTable2 += `<td>${payment.AppliedAmount}</td>`;
                    htmlTable2 += '</tr>';
                }

                htmlTable2 += '</table>';
                htmlTable += htmlTable2;
                // Sends email to ccount accessing NetSuite
                email.send({
                    author: AUTHOR,
                    recipients: USEREMAIL,
                    subject: 'MR TEST',
                    body: htmlTable,
                });
                
                } catch (e) {
                    log.error('Error in Reduce Stage', e);
                }
                }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });