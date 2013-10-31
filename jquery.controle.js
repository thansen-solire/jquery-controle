/**
 * @author Thomas <thansen@solire.fr>
 * @licence Solire <http://www.solire.fr>
 */
(function($) {
    $.fn.controle = function(params, newRegularExpressions) {
        var falsev = !1,
            truev = !falsev,
            regularExpressions = {
//                txt     : /^[a-zA-Zàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\s]{2,}$/, // texte uniquement
//                txt2    : /^[0-9a-zA-Zàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\s]{2,}$/, // texte uniquement
                num                 : /^[0-9]+$/, // chiffres et nombres uniquement
                numnotnul           : /^[1-9]{1}|[0-9]{2,16}$/, // chiffres et nombres uniquement
                tel                 : /^[\s\/\(\)\+\.0-9]{8,20}$/, // No tél
                cp                  : /^[0-9]{4,5}$/, // code postal francais
                heure               : /^[0-9]{2}:[0-9]{2}(:[0-9]|)$/, // heure
                date                : /^[0-9]{2,2}\/[0-9]{2,2}\/[0-9]{4,4}$/, // date francaise
                email               : /^[a-z0-9._-]+@[a-z0-9.-]{2,}[.][a-z]{2,3}$/, // email
                url                 : /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/, // adresse url
                rew                 : /^[0-9a-z-]{1,50}$/, // rewriting
                notnul              : function(value) {
                    return (value != '' && value != 0);
                },
                mix                 : function(value) {
                    return (value.length > 2);
                }
            },
            defaults = {
                controlHandler      : '.form-controle',
                ajax                : falsev,

                elmtEvents          : falsev,

                ifFirstWrong        : falsev,
                ifWrong             : falsev,
                ifRight             : falsev,

                beforeElmtCheck     : falsev,
                beforeCheck         : falsev,
                beforeSubmit        : falsev,
                afterSubmit         : falsev
            };

        regularExpressions = $.extend({}, regularExpressions, newRegularExpressions);

        params = params || {};

        events = params.elmtEvents || {};
        events = $.extend({}, defaults.elmtEvents, events);

        params = $.extend(defaults, params);
        params.elmtEvents = events;

        return this.each(function(){
            var obj = $(this),
                options = params,
                func,
                controleOk,
                method = obj.attr('method');

            if (typeof method == 'undefined' || method == null) {
                method = 'post';
            }

            obj.submit(function(event){
                var data, action;

                if (isFunc(options.beforeCheck)) {
                    func = options.beforeCheck;
                    func.call(obj);
                }

                controleOk = checkForm();

                if (controleOk) {
                    if (isFunc(options.beforeSubmit)) {
                        func = options.beforeSubmit;
                        func.call(obj);
                    }

                    if (options.ajax !== falsev) {
                        action  = obj.attr('action');
                        data    = obj.serialize();

                        $.ajax({
                            url         : action,
                            data        : data,
                            type        : method,
                            dataType    : 'json',
                            success     : function(response) {
                                if (isFunc(options.afterSubmit)) {
                                    func = options.afterSubmit;
                                    func.call(obj, response);
                                }
                            }
                        });
                    }
                    else
                        return truev;
                }

                event.preventDefault();
                return falsev;
            });

            if (options.elmtEvents){
                for (evnt in options.elmtEvents) {
                    $(options.controlHandler, obj).bind(evnt, options.elmtEvents[evnt]);
                }
            }

            function checkForm(){
                var ok = truev;

                $(options.controlHandler, obj).each(function(){
                    var func;

                    if(!controleElmt($(this))){
                        if (ok) {
                            ok = falsev;

                            if (isFunc(options.ifFirstWrong)) {
                                func = options.ifFirstWrong;
                                func.call(obj, $(this));
                            }
                        }
                    }
                });

                return ok;
            };

            function controleElmt(elmt){
                var testdonnee,
                    classes,
                    oblig,
                    typeDonnee,
                    value,
                    expcourrante,
                    index0,
                    func;

                if (isFunc(options.beforeElmtCheck)) {
                    func = options.beforeElmtCheck;
                    func.call(obj, elmt);
                }

                value = elmt.val();

                testdonnee = truev;

                if(typeof elmt.attr('class') == "undefined") {
                    return truev;
                }

                classes     = elmt.attr('class').split(' ');
                index0      = $.inArray('form-controle', classes);

                if (classes.length < index0 + 3) {
                    return truev;
                }

                oblig       = classes[index0 + 1] == 'form-oblig' || value != '';
                typeDonnee  = classes[index0 + 2].replace('form-', '');

                if(oblig && typeDonnee in regularExpressions){
                    expcourrante = regularExpressions[typeDonnee];

                    if (isFunc(expcourrante)) {
                        testdonnee = expcourrante.call(obj, value, elmt);
                    } else {
                        testdonnee = expcourrante.test(value);
                    }
                }

                if(testdonnee == falsev){
                    if (isFunc(options.ifWrong)) {
                        func = options.ifWrong;
                        func.call(obj, elmt);
                    }

                    return falsev;
                }

                if (isFunc(options.ifRight)) {
                    func = options.ifRight;
                    func.call(obj, elmt);
                }

                return truev;
            };

            function isFunc(func){
				return $.isFunction(func);
			};
        });
	};
})(jQuery);