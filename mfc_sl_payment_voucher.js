/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/task', 'N/ui/serverWidget', 'N/redirect', 'N/search', 'N/ui/message'],
/**
 * @param{runtime} runtime
 * @param{task} task
 * @param{serverWidget} serverWidget
 * @param{redirect} redirect
 * @param{search} search
 * @param{message} message
 */
(runtime, task, serverWidget, redirect, search, message) => {
    /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if (scriptContext.request.method === 'GET') {
                 // init message
                let scr = runtime.getCurrentScript();
                let INITPARAM = scriptContext.request.parameters.custscript_mfc_cpv_init;
                
                //  parameters 
                const PAYMENTSEARCH = scr.getParameter({name: 'custscript_mfc_cpv_payments'});
                const MRSCRIPTID = scr.getParameter({name: 'custscript_mfc_mr_id'});
                const MRSCRIPTDEPL = scr.getParameter({name: 'custscript_mfc_mr_depl'});




                // Create Suitlete Form
                var form = serverWidget.createForm({
                    title: 'Custom Payment Voucher' // Custom Title
                });
                // add submit button
                form.addSubmitButton({
                    label: 'Submit',
                    id: 'custpage_submit'

                });
                // add cancel button
                form.addButton({
                    label: 'Cancel',
                    id: 'custpage_cancel',
                    functionName: 'cancelButtonClick'
                });// add fields
                form.addFieldGroup({
                    id: 'custpage_fields',
                    label: 'Report Filters'
                });
                var sublist = form.addSublist({
                    id: 'custpage_my_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Payments'
                });
                sublist.addMarkAllButtons();
                    sublist.addField({
                    id: 'custpage_print',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Print'
                });
                sublist.addField({
                    id: 'custpage_internalid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Internal ID'
                });
                sublist.addField({
                    id: 'custpage_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date'
                });
                sublist.addField({
                    id: 'custpage_docnum',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Document Number'
                });
                sublist.addField({
                    id: 'custpage_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ID'
                });
                sublist.addField({
                    id: 'custpage_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Name'
                });
                sublist.addField({
                    id: 'custpage_amount',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount'
                });
                // hides Internal Id field
                sublist.getField({
                    id: 'custpage_internalid'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                //  iteratate through the search and populate sublist
                const eSearch = search.load({id: PAYMENTSEARCH});
                let retArr = [];
                let retObj = {};
                let eResultsPaged = eSearch.runPaged({pageSize: 1000});

                eResultsPaged.pageRanges.forEach(function(pageRange) {
                    let ePage = eResultsPaged.fetch({index: pageRange.index});
                    ePage.data.forEach(function(res) {

                        // get values off search
                        let internalID =    res.getValue(res.columns[0]);
                        let date =          res.getValue(res.columns[1]);
                        let documentNum =   res.getValue(res.columns[2]);
                        let ID =            res.getValue(res.columns[3]);
                        let name =          res.getValue(res.columns[4]);
                        let amount =        res.getValue(res.columns[5]);
                       

                       
                       // create object with values/text
                        retObj = {
                            InternalID: internalID,
                            Date: date,
                            DocumentNumber: documentNum,
                            ID: ID,
                            Name: name,
                            Amount: amount
                        };

                        // push returned object into array
                        retArr.push(retObj);
                    });
                });

                  // loop through Array and write to form
                for (let i = 0; i < retArr.length; i++){
                    if (isNullOrEmpty(retArr[i].InternalID)) {
                        retArr[i].InternalID = ' ';
                    }
                    sublist.setSublistValue({
                        id: 'custpage_internalid',
                        line: i,
                        value: retArr[i].InternalID
                    });
                    if (isNullOrEmpty(retArr[i].Date)) {
                        retArr[i].Date = ' ';
                    }
                    sublist.setSublistValue({
                        id: 'custpage_date',
                        line: i,
                        value: retArr[i].Date
                    });
                    if (isNullOrEmpty(retArr[i].DocumentNumber)) {
                        retArr[i].DocumentNumber = ' ';
                    }
                    sublist.setSublistValue({
                        id: 'custpage_docnum',
                        line: i,
                        value: retArr[i].DocumentNumber
                    });
                    if (isNullOrEmpty(retArr[i].ID)) {
                        retArr[i].InternalID = 0;
                    }
                    sublist.setSublistValue({
                        id: 'custpage_id',
                        line: i,
                        value: retArr[i].ID
                    });
                    if (isNullOrEmpty(retArr[i].Name)) {
                        retArr[i].Name = 0;
                    }
                    sublist.setSublistValue({
                        id: 'custpage_name',
                        line: i,
                        value: retArr[i].Name
                    });
                    if (isNullOrEmpty(retArr[i].Amount)) {
                        retArr[i].Amount = 0;
                    }
                    sublist.setSublistValue({
                        id: 'custpage_amount',
                        line: i,
                        value: retArr[i].Amount
                    });


                }
                
                // Verification - Might need to change message
                if (INITPARAM === 'true') {
                    form.addPageInitMessage({
                        type: message.Type.CONFIRMATION,
                        title: 'SUCCESS',
                        message: 'Your report is being generated and sent to the email provided.',
                        duration: 7000
                    });
                };
                // write form
                scriptContext.response.writePage(form);

            const SCRIPTID = 'custscript_mfc_mr_id';
            const SCRIPTDEPL = 'custscript_mfc_mr_depl';







        } else if (scriptContext.request.method == 'POST') {
            try{

        const sublistFieldName = 'custpage_my_sublist';
        const printCheckboxFieldId = 'custpage_print';
        const returnArray = [];

        const sublistLineCount = scriptContext.request.getLineCount({
            group: sublistFieldName
        });

        for (let i = 0; i < sublistLineCount; i++) {
            const printCheckboxValue = scriptContext.request.getSublistValue({
                group: sublistFieldName,
                name: printCheckboxFieldId,
                line: i
            });

            if (printCheckboxValue === 'T') {
                let internalId = scriptContext.request.getSublistValue({
                    group: sublistFieldName,
                    name: 'custpage_internalid',
                    line: i
                });
                let documentNumber = scriptContext.request.getSublistValue({
                    group: sublistFieldName,
                    name: 'custpage_docnum',
                    line: i
                });
                let date = scriptContext.request.getSublistValue({
                    group: sublistFieldName,
                    name: 'custpage_date',
                    line: i
                });
                let id = scriptContext.request.getSublistValue({
                    group: sublistFieldName,
                    name: 'custpage_id',
                    line: i
                });
                let name = scriptContext.request.getSublistValue({
                    group: sublistFieldName,
                    name: 'custpage_name',
                    line: i
                });
                let amount = scriptContext.request.getSublistValue({
                    group: sublistFieldName,
                    name: 'custpage_amount',
                    line: i
                });

                let obj = {
                    InternalID: internalId,
                    Date: date,
                    DocumentNumber: documentNumber,
                    ID: id,
                    Name: name,
                    Amount: amount
                };

                returnArray.push(obj);
            }
        }
        log.debug('Return Array', returnArray);
        let user = runtime.getCurrentUser();

        // Grab the parameters in Post
        const mapReduceScriptId = runtime.getCurrentScript().getParameter({
            name: 'custscript_mfc_mr_id'
          });
          const mapReduceDeploymentId = runtime.getCurrentScript().getParameter({
            name: 'custscript_mfc_mr_depl'
          });
  
          const mapReduceParams = {
            'custscript_mfc_payment_data': JSON.stringify(returnArray),
            'custscript_mfc_email': user.email
          };



        let scriptTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: mapReduceScriptId,
            deploymentId: mapReduceDeploymentId,
            params: mapReduceParams
        });

        
        let taskId = scriptTask.submit();
        log.debug('Map/Reduce Script Task Scheduled', 'Task ID: ' + taskId);

        redirectToSuitelet();
    } catch (e) {
        throw log.error('Error in calling Map/Reduce Script', e);
    }
}

}

        const isNullOrEmpty = (val) => {
            if (val === null || val === undefined || val === '') {
                return true;
            } else {
                return false;
            }
        }

        const redirectToSuitelet = () => {
            const SUITELETID = 'customscript_mfc_sl_payment_voucher';
            const DEPLOYMENTID = 'customdeploy_mfc_sl_payment_voucher'

        // redirect back to suitelet
        redirect.toSuitelet({
            scriptId: SUITELETID,
            deploymentId: DEPLOYMENTID,
            parameters: {
                'custscript_mfc_cpv_init': 'true'
            }
        });
    }



        return {onRequest,isNullOrEmpty,redirectToSuitelet}
    
    });