angular.module("proton.squire", [
    "proton.tooltip"
])
.directive("squire", function(tools, $rootScope) {
    return {
        restrict: 'E',
        require: "ngModel",
        scope: {
            height: '=',
            ngModel: '=',
            message: '='
        },
        replace: true,
        transclude: true,
        templateUrl: "templates/directives/squire.tpl.html",

        /* @ngInject */
        controller: function($scope, $rootScope, $sanitize, tools) {
            var editorVisible;
            editorVisible = true;

            $scope.isEditorVisible = function() {
                return editorVisible;
            };

            $scope.isPlain = function() {
                var result = false;

                if($scope.data.format === 'plain') {
                    result = true;
                }

                if($rootScope.isMobile && $rootScope.browser === 'Safari') {
                    // result = true;
                }

                return result;
            };

            $scope.isHtml = function() {
                var result = false;

                if($scope.data.format === 'html') {
                    result = true;
                }

                return result;
            };
        },
        link: function(scope, element, attrs, ngModel) {
            var IFRAME_CLASS, LINK_DEFAULT, IMAGE_DEFAULT, editor, getLinkAtCursor, iframe, iframeLoaded, isChrome, isFF, isIE, loaded, menubar, ua, updateModel, updateStylesToMatch;

            LINK_DEFAULT = IMAGE_DEFAULT ="";
            IFRAME_CLASS = 'angular-squire-iframe';
            editor = scope.editor = null;
            scope.data = {
                link: LINK_DEFAULT,
                image: IMAGE_DEFAULT,
                format: 'html'
            };

            updateModel = function(value) {
                return scope.$evalAsync(function() {
                    ngModel.$setViewValue(value);
                    if (ngModel.$isEmpty(value)) {
                        return element.removeClass('squire-has-value');
                    } else {
                        return element.addClass('squire-has-value');
                    }
                });
            };
            ngModel.$render = function() {
                return editor !== null ? editor.setHTML(ngModel.$viewValue || '') : void 0;
            };
            ngModel.$isEmpty = function(value) {
                if (angular.isString(value)) {
                    return angular.element("<div>" + value + "</div>").text().trim().length === 0;
                } else {
                    return !value;
                }
            };
            getLinkAtCursor = function() {
                if (!editor) {
                    return LINK_DEFAULT;
                }
                return angular.element(editor.getSelection().commonAncestorContainer).closest("a").attr("href");
            };
            scope.canRemoveLink = function() {
                var href;
                href = getLinkAtCursor();
                return href && href !== LINK_DEFAULT;
            };
            scope.canAddLink = function() {
                return scope.data.link && scope.data.link !== LINK_DEFAULT;
            };
            scope.canAddImage = function() {
                return scope.data.image && scope.data.image !== IMAGE_DEFAULT;
            };
            scope.$on('$destroy', function() {
                return editor !== null ? editor.destroy() : void 0;
            });
            scope.popoverHide = function(e, name) {
                var hide;
                hide = function() {
                    angular.element(e.target).closest(".popover-visible").removeClass("popover-visible");
                    return scope.action(name);
                };
                if (e.keyCode) {
                    if (e.keyCode === 13) {
                        return hide();
                    }
                } else {
                    return hide();
                }
            };
            scope.popoverShow = function(e) {
                var linkElement, popover, liElement;
                linkElement = angular.element(e.currentTarget);
                liElement = angular.element(linkElement).parent();
                if (angular.element(e.target).closest(".squire-popover").length) {
                    return;
                }
                if (linkElement.hasClass("popover-visible")) {
                    return;
                }
                linkElement.addClass("popover-visible");
                if (/>A\b/.test(editor.getPath()) || editor.hasFormat('A')) {
                    scope.data.link = getLinkAtCursor();
                } else {
                    scope.data.link = LINK_DEFAULT;
                }
                popover = element.find(".squire-popover").find("input").focus().end();
                popover.css({
                    left: -1 * (popover.width() / 2) + liElement.width() / 2
                });
            };
            scope.switchTo = function(format) {
                var value = editor.getHTML();
                var end;

                if(format === 'plain') {
                    // TODO manage blockquote
                    // var start = tools.block(html, 'start');
                    // var plain = tools.plaintext(start);
                    // var quote = tools.quote(plain);
                    // var end = tools.block(quote.replace(/<br\s*[\/]?>/gi, "\n"), 'end');
                    end = tools.plaintext(value);
                    scope.data.format = format;
                } else if (format === 'html') {
                    end = tools.html(value);
                    scope.data.format = format;
                }

                updateModel(end);
            };
            updateStylesToMatch = function(doc) {
                var head;
                head = doc.head;

                var a;
                a = doc.createElement('link');
                a.setAttribute('href', '/assets/editor.css');
                a.setAttribute('type', 'text/css');
                a.setAttribute('rel', 'stylesheet');
                head.appendChild(a);

                doc.childNodes[0].className = IFRAME_CLASS + " ";
                if (scope.editorClass) {
                    return doc.childNodes[0].className += scope.editorClass;
                }
            };
            iframeLoaded = function() {

                var iframeDoc = iframe[0].contentWindow.document;

                updateStylesToMatch(iframeDoc);
                ngModel.$setPristine();
                editor = new Squire(iframeDoc);
                editor.defaultBlockTag = 'P';
                if (scope.ngModel) {
                    editor.setHTML(scope.ngModel);
                    updateModel(scope.ngModel);
                }
                editor.addEventListener("input", function() {
                    var html = editor.getHTML();
                    updateModel(html);
                });
                editor.addEventListener("focus", function() {
                    element.addClass('focus').triggerHandler('focus');
                });
                editor.addEventListener("blur", function() {
                    element.removeClass('focus').triggerHandler('blur');

                    if (ngModel.$pristine && !ngModel.$isEmpty(ngModel.$viewValue)) {
                        ngModel.$setTouched();
                    } else {
                        ngModel.$setPristine();
                    }
                });
                editor.addEventListener("pathChange", function() {
                    var p, ref;

                    p = editor.getPath();
                    if (/>A\b/.test(p) || editor.hasFormat('A')) {
                        element.find('.add-link').addClass('active');
                    } else {
                        element.find('.add-link').removeClass('active');
                    }
                });
                editor.alignRight = function() {
                    return editor.setTextAlignment("right");
                };
                editor.alignCenter = function() {
                    return editor.setTextAlignment("center");
                };
                editor.alignLeft = function() {
                    return editor.setTextAlignment("left");
                };
                editor.alignJustify = function() {
                    return editor.setTextAlignment("justify");
                };
                editor.makeHeading = function() {
                    editor.setFontSize("2em");

                    return editor.bold();
                };

                if(angular.isDefined(scope.message)) {
                    scope.message.editor = editor;
                    $rootScope.$broadcast('listenEditor', scope.message);
                }
            };

            iframe = element.find('iframe.squireIframe');
            var iframeDoc = iframe.contentDocument || iframe.contentWindow && iframe.contentWindow.document;
            menubar = element.find('.menu');
            loaded = false;

            // Check if browser is Webkit (Safari/Chrome) or Opera
            if(jQuery.browser.webkit || jQuery.browser.opera || jQuery.browser.chrome) {
                // Start timer when loaded.
                $(iframe).load(function () {
                    loaded = true;
                    iframeLoaded();
                });

                // Safari and Opera need a kick-start.
                var source = $(iframe).attr('src');
                $(iframe).attr('src', '');
                $(iframe).attr('src', source);
            } else {
                // For other browsers.
                if(iframeDoc && iframeDoc.readyState  === 'complete') {
                    loaded = true;
                    iframeLoaded();
                } else {
                    $(iframe).load(function() {
                        loaded = true;
                        iframeLoaded();
                    });
                }
            }

            Squire.prototype.testPresenceinSelection = function(name, action, format, validation) {
                var p, test;
                p = this.getPath();
                test = validation.test(p) | this.hasFormat(format);
                return name === action && test;
            };

            scope.action = function(action) {
                var node, range, selection, test;
                if (!editor) {
                    return;
                }
                test = {
                    value: action,
                    testBold: editor.testPresenceinSelection("bold", action, "B", />B\b/),
                    testItalic: editor.testPresenceinSelection("italic", action, "I", />I\b/),
                    testUnderline: editor.testPresenceinSelection("underline", action, "U", />U\b/),
                    testOrderedList: editor.testPresenceinSelection("makeOrderedList", action, "OL", />OL\b/),
                    testUnorderedList: editor.testPresenceinSelection("makeUnorderedList", action, "UL", />UL\b/),
                    testLink: editor.testPresenceinSelection("removeLink", action, "A", />A\b/),
                    testQuote: editor.testPresenceinSelection("increaseQuoteLevel", action, "blockquote", />blockquote\b/),
                    isNotValue: function(a) {
                        return a === action && this.value !== "";
                    }
                };
                if (test.testBold || test.testItalic || test.testUnderline || test.testOrderedList || test.testUnorderedList || test.testQuote || test.testLink) {
                    if (test.testBold) {
                        editor.removeBold();
                    }
                    if (test.testItalic) {
                        editor.removeItalic();
                    }
                    if (test.testUnderline) {
                        editor.removeUnderline();
                    }
                    if (test.testOrderedList) {
                        editor.removeList();
                    }
                    if (test.testUnorderedList) {
                        editor.removeList();
                    }
                    if (test.testQuote) {
                        editor.decreaseQuoteLevel();
                    }
                    if (test.testLink) {
                        editor.removeLink();
                        return editor.focus();
                    }
                } else if (test.isNotValue("removeLink")) {

                } else if (action === 'makeLink') {
                    if (!scope.canAddLink()) {
                        return;
                    }
                    node = angular.element(editor.getSelection().commonAncestorContainer).closest('a')[0];
                    if (node) {
                        range = iframe[0].contentWindow.document.createRange();
                        range.selectNodeContents(node);
                        selection = iframe[0].contentWindow.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    editor.makeLink(scope.data.link, {
                        target: '_blank',
                        title: scope.data.link,
                        rel: "nofollow"
                    });
                    scope.data.link = LINK_DEFAULT;
                    return editor.focus();
                } else if(action === 'insertImage') {
                    if(scope.data.image.length > 0) {
                        editor.insertImage(scope.data.image);
                    }
                    return editor.focus();
                } else {
                    editor[action]();
                    return editor.focus();
                }
            };
        }
    };
}).directive("squireControls", function() {
    return {
        restrict: 'E',
        scope: false,
        replace: true,
        transclude: true,
        require: "^squire",
        template: "<ng-transclude class=\"angular-squire-controls\">\n</ng-transclude>",
        link: function(scope, element, attrs, editorCtrl) {

        }
    };
});
