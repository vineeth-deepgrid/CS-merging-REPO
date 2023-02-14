import { Directive, HostListener, Input } from '@angular/core';

import {
    FacebookParams, TwitterParams, GooglePlusParams, PinterestParams, MessengerParams,
    LinkedinParams, WhatsappParams, TelegramParams, EmailParams
} from './social-share-params';
@Directive({
    selector: '[appSocialShare]'
})
export class SocialShareDirective {
    @Input() facebook: FacebookParams;
    @Input() messenger: MessengerParams;
    @Input() twitter: TwitterParams;
    @Input() googlePlus: GooglePlusParams;
    @Input() pinterest: PinterestParams;
    @Input() linkedIn: LinkedinParams;
    @Input() whatsApp: WhatsappParams;
    @Input() telegram: TelegramParams;
    @Input() email: EmailParams;
    @Input() shareWidth: string;
    @Input() shareHeight: string;


    private sharers = {
        facebook: {
            shareUrl: 'https://www.facebook.com/sharer/sharer.php',
            // params: {u: this.url}
        },
        messenger: {
            shareUrl: 'fb-messenger://share'
            // params:{link: this.url}
        },
        googleplus: {
            shareUrl: 'https://plus.google.com/share',
            // params: {url: this.url}
        },
        linkedin: {
            shareUrl: 'https://www.linkedin.com/shareArticle',
            /*params: {
                url: this.url,
                mini: true
            }*/
        },
        twitter: {
            shareUrl: 'https://twitter.com/intent/tweet/',
            /*params: {
                text: this.title,
                url: this.url,
                hashtags: this.hashtags,
                via: this.via
            }*/
        },
        email: {
            shareUrl: 'mailto:', // + this.to,
            /*params: {
                subject: this.subject,
                body: this.title + '\n' + this.url
            },*/
            isLink: true
        },
        whatsapp: {
            shareUrl: 'whatsapp://send',
            /*params: {
                text: this.title + ' ' + this.url
            },*/
            isLink: true
        },
        telegram: {
            shareUrl: 'tg://msg_url',
            /*params: {
                text: this.title + ' ' + this.url
            },*/
            isLink: true
        },
        viber: {
            shareUrl: 'viber://forward',
            /*params: {
                text: this.title + ' ' + this.url
            },*/
            isLink: true
        },
        line: {
            // shareUrl: 'http://line.me/R/msg/text/?' + encodeURIComponent(this.title + ' ' + this.url),
            isLink: true
        },
        pinterest: {
            shareUrl: 'https://www.pinterest.com/pin/create/button/',
            /*params: {
                url: this.url,
                media: this.image,
                description: this.description
            }*/
        },
        tumblr: {
            shareUrl: 'http://tumblr.com/widgets/share/tool',
            /*params: {
                canonicalUrl: this.url,
                content: this.url,
                posttype: 'link',
                title: this.title,
                caption: this.caption,
                tags: this.tags
            }*/
        },
        hackernews: {
            shareUrl: 'https://news.ycombinator.com/submitlink',
            /*params: {
                u: this.url,
                t: this.title
            }*/
        },
        reddit: {
            shareUrl: 'https://www.reddit.com/submit',
            // params: {'url': this.url}
        },
        vk: {
            shareUrl: 'http://vk.com/share.php',
            /*params: {
                url: this.url,
                title: this.title,
                description: this.caption,
                image: this.image
            }*/
        },
        xing: {
            shareUrl: 'https://www.xing.com/app/user',
            /*params: {
                'op': 'share',
                'url': this.url,
                'title': this.title
            }*/
        },
        buffer: {
            shareUrl: 'https://buffer.com/add',
            /*params: {
                url: this.url,
                title: this.title,
                via: this.via,
                picture: this.picture
            }*/
        },
        instapaper: {
            shareUrl: 'http://www.instapaper.com/edit',
            /*params: {
                url: this.url,
                title: this.title,
                description: this.description
            }*/
        },
        pocket: {
            shareUrl: 'https://getpocket.com/save',
            /*params: {
                url: this.url
            }*/
        },
        digg: {
            shareUrl: 'http://www.digg.com/submit',
            /*params: {
                url: this.url
            }*/
        },
        stumbleupon: {
            shareUrl: 'http://www.stumbleupon.com/submit',
            /*params: {
                url: this.url,
                title: this.title
            }*/
        },
        flipboard: {
            shareUrl: 'https://share.flipboard.com/bookmarklet/popout',
            /*params: {
                v: 2,
                title: this.title,
                url: this.url,
                t: Date.now()
            }*/
        },
        /*weibo: {
            shareUrl: 'http://service.weibo.com/share/share.php',
            params: {
                url: this.url,
                title: this.title,
                pic: this.image,
                appkey: this.getValue('appkey'),
                ralateUid: this.getValue('ralateuid'),
                language: 'zh_cn'
            }
        },*/
        renren: {
            shareUrl: 'http://share.renren.com/share/buttonshare',
            /*params: {
                link: this.url
            }*/
        },
        myspace: {
            shareUrl: 'https://myspace.com/post',
            /*params: {
                u: this.url,
                t: this.title,
                c: this.description
            }*/
        },
        blogger: {
            shareUrl: 'https://www.blogger.com/blog-this.g',
            /*params: {
                u: this.url,
                n: this.title,
                t: this.description
            }*/
        },
        baidu: {
            shareUrl: 'http://cang.baidu.com/do/add',
            /*params: {
                it: this.title,
                iu: this.url
            }*/
        },
        douban: {
            shareUrl: 'https://www.douban.com/share/service',
            /*params: {
                name: this.title,
                href: this.url,
                image: this.image
            }*/
        },
        okru: {
            shareUrl: 'https://connect.ok.ru/dk',
            /*params: {
                'st.cmd': 'WidgetSharePreview',
                'st.shareUrl': this.url,
                'title': this.title
            }*/
        }
    };

    constructor() { }


    private urlSharer(sharer: any) {
        const p = sharer.params || {},
            keys = Object.keys(p);
            let i: any,
            str = keys.length > 0 ? '?' : '';
        for (i = 0; i < keys.length; i++) {
            if (str !== '?') {
                str += '&';
            }
            if (p[keys[i]]) {
                str += keys[i] + '=' + encodeURIComponent(p[keys[i]]);
            }
        }

        const url = sharer.shareUrl + str;

        if (window != null && window !== undefined) {
            if (!sharer.isLink) {
                const popWidth = sharer.width || 600,
                    popHeight = sharer.height || 480,
                    left = window.innerWidth / 2 - popWidth / 2 + window.screenX,
                    top = window.innerHeight / 2 - popHeight / 2 + window.screenY,
                    popParams = 'scrollbars=no, width=' + popWidth + ', height=' + popHeight + ', top=' + top + ', left=' + left,
                    newWindow = window.open(url, '', popParams);

                if (window.focus) {
                    newWindow.focus();
                }
            } else {
                window.location.href = url;
            }
        }
    }


    private getSharer() {
        let _sharer: any = {};
        if (this.facebook) {
            _sharer = this.sharers['facebook'];
            _sharer.params = this.facebook;
        }
        if (this.messenger) {
            _sharer = this.sharers['messenger'];
            _sharer.params = this.messenger;
        }
        if (this.googlePlus) {
            _sharer = this.sharers['googleplus'];
            _sharer.params = this.googlePlus;
        }

        if (this.twitter) {
            _sharer = this.sharers['twitter'];
            _sharer.params = this.twitter;
        }

        if (this.pinterest) {
            _sharer = this.sharers['pinterest'];
            _sharer.params = this.pinterest;
        }

        if (this.linkedIn) {
            _sharer = this.sharers['linkedin'];
            _sharer.params = this.linkedIn;
        }

        if (this.whatsApp) {
            _sharer = this.sharers['whatsapp'];
            _sharer.params = this.whatsApp;
        }

        if (this.telegram) {
            _sharer = this.sharers['telegram'];
            _sharer.params = this.telegram;
        }

        if (this.email) {
            _sharer = this.sharers['email'];
            _sharer.params = this.email;
        }

        return _sharer;

    }

    @HostListener('click') share() {


        const s = this.getSharer();
        // custom popups sizes
        // console.log(s);
        if (s) {
            s.width = this.shareWidth;
            s.height = this.shareHeight;
        }
        return s !== undefined ? this.urlSharer(s) : false;

    }



}
