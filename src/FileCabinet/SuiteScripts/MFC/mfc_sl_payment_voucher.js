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
                //
                // Need to add parameters - sure if correct
                const PAYMENTSEARCH = scr.getParameter({name: 'custscript_mfc_cpv_payments'});
                const MRSCRIPTID = scr.getParameter({name: 'custscript_mfc_mr_id'});
                const MRSCRIPTDEPL = scr.getParameter({name: 'custscript_mfc_mr_depl'});



                //
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
                });
                form.addFieldGroup({
                    id: 'print',
                    label: 'Report Filters'
                });
                 // Create Header Report Sublist and add labels
                 var headerSublist = form.addSublist({
                    id: 'custpage_header_sublist',
                    label: 'Header Report',
                    type: serverWidget.SublistType.LIST,
                 })











                // Verification - Might need to change message
                if (INITPARAM === 'true') {
                    form.addPageInitMessage({
                        type: message.Type.CONFIRMATION,
                        title: 'SUCCESS',
                        message: 'Your report is being generated and sent to the email provided.',
                        duration: 7000
                    });
                }

                scriptContext.response.writePage(form);







        } else if (scriptContext.request.method == 'POST') {

        }


    }


        return {onRequest}

    });