/*!
 * @author Thomas <thansen@solire.fr>
 * @licence CC BY-NC 4.0 http://creativecommons.org/licenses/by-nc/4.0/
 */
(function($) {
    $.fn.controle = function(params, newRegularExpressions) {
        var falsev = !1,
            truev = !falsev,
            regularExpressions = {
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
                },
                atleastonechecked   : function(value, elmt){
                    var name = elmt.attr('name'),
                        number = $('input[name="' + name + '"]:checked', this).length;
                    return (number > 0);
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

        function controleChamp(form, elmt)
        {
            this.form = $(form);
            this.elmt = $(elmt);
            this.check = function(){
                var testdonnee,
                    classes,
                    oblig,
                    typeDonnee,
                    value,
                    expcourrante,
                    index0,
                    func,
                    regexps;

                if (isFunc(params.beforeElmtCheck)) {
                    func = params.beforeElmtCheck;
                    func.call(this.form, this.elmt, this);
                }

                value = this.elmt.val();

                testdonnee = truev;

                if(typeof this.elmt.attr('class') === 'undefined') {
                    return truev;
                }

                classes     = this.elmt.attr('class').split(' ');
                index0      = $.inArray('form-controle', classes);

                if (classes.length < index0 + 3) {
                    return truev;
                }

                oblig       = classes[index0 + 1] == 'form-oblig' || value != '';
                typeDonnee  = classes[index0 + 2].replace('form-', '');

                if(oblig && typeDonnee in regularExpressions){
                    expcourrante = regularExpressions[typeDonnee];

                    if (isFunc(expcourrante)) {
                        testdonnee = expcourrante.call(this.form, value, this.elmt, this);
                    } else {
                        if (!$.isArray(expcourrante)) {
                            regexps = [expcourrante];
                        } else {
                            regexps = expcourrante;
                        }

                        $.each(regexps, function(ii, regexp) {
                            if (testdonnee) {
                                testdonnee = regexp.test(value);
                            }
                        });
                    }
                }

                if(testdonnee === falsev){
                    if (isFunc(params.ifWrong)) {
                        func = params.ifWrong;
                        func.call(this.form, this.elmt, this);
                    }

                    return falsev;
                }

                if (isFunc(params.ifRight)) {
                    func = params.ifRight;
                    func.call(this.form, this.elmt, this);
                }

                return truev;
            }
        }

        function controleForm(form)
        {
            this.form = $(form);
            this.champs = [];
            this.init = function(){
                var self = this;
                $(params.controlHandler, this.form).each(function(){
                    self.champs.push(new controleChamp(this.form, this));
                });
            };
            this.check = function(){
                var ok = truev;

                $.each(this.champs, function(ii, thischamp){
                    var func;
                    if (!thischamp.check()){
                        if (ok) {
                            ok = falsev;

                            if (isFunc(params.ifFirstWrong)) {
                                func = params.ifFirstWrong;
                                func.call($(self), thischamp.elmt, thischamp);
                            }
                        }
                    }
                });

                return ok;
            };

            this.init();
        }

        return this.each(function(){
            var self = this,
                func,
                controleOk,
                method = $(self).attr('method'),
                formObj = new controleForm(this);

            if (typeof method == 'undefined' || method == null) {
                method = 'post';
            }

            if (params.elmtEvents){
                for (evnt in params.elmtEvents) {
                    $.each(formObj.champs, function(ii, curChamp) {
                        var curEvnt = evnt;
                        curChamp.elmt.bind(curEvnt, function(e){
                            params.elmtEvents[curEvnt].call(this, e, curChamp);
                        });
                    });
                }
            }

            formObj.form.submit(function(event){
                var data,
                    action;

                if (isFunc(params.beforeCheck)) {
                    func = params.beforeCheck;
                    func.call(formObj.form, formObj);
                }

                controleOk = formObj.check();

                if (controleOk) {
                    if (isFunc(params.beforeSubmit)) {
                        func = params.beforeSubmit;
                        func.call(formObj.form, formObj);
                    }

                    if (params.ajax !== falsev) {
                        action  = formObj.form.attr('action');
                        data    = formObj.form.serialize();

                        $.ajax({
                            url         : action,
                            data        : data,
                            type        : method,
                            dataType    : 'json',
                            success     : function(response) {
                                if (isFunc(params.afterSubmit)) {
                                    func = params.afterSubmit;
                                    func.call(formObj.form, response, formObj);
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
        });

        function isFunc(func){
            return $.isFunction(func);
        };
    };
})(jQuery);
