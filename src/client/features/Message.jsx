import React, { Component } from 'react';
import PropTypes from 'prop-types';
import format from 'date-format';
import { connect } from 'react-redux';
import { Spin } from 'antd';

import Avatar from 'components/Avatar';
import Highlight from 'components/Highlight';
import Icon from 'components/Icon';

import 'styles/feature/message.less';
// styles list: https://highlightjs.org/static/demo/
import 'highlight.js/styles/vs.css';

let scrollMessage = null;
let scrollMessageTask = null;
let scrollHistoryMessage = null;
let scrollHistoryMessageTask = null;

class Message extends Component {
    static propTypes = {
        avatar: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        time: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]).isRequired,
        type: PropTypes.string.isRequired,
        content: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]).isRequired,
        isSimple: PropTypes.bool,
        status: PropTypes.string,
        shouldScroll: PropTypes.bool.isRequired,
        isHistory: PropTypes.bool.isRequired,
        isHistoryScrollTarget: PropTypes.bool.isRequired,
    }
    static defaultProps = {
        isSimple: false,
    }
    componentDidMount() {
        if (this.props.isHistory) {
            if (this.props.isHistoryScrollTarget) {
                const nextMsg = this.msg.nextSibling;
                scrollHistoryMessage = nextMsg.scrollIntoView.bind(nextMsg, false);
            }
            if (scrollHistoryMessageTask) {
                clearTimeout(scrollHistoryMessageTask);
            }
            scrollHistoryMessageTask = setTimeout(scrollHistoryMessage, 100);
        } else if (this.props.shouldScroll) {
            scrollMessage = this.msg.scrollIntoView.bind(this.msg, false);
            // 避免连续scroll
            if (scrollMessageTask) {
                clearTimeout(scrollMessageTask);
            }
            scrollMessageTask = setTimeout(scrollMessage, 100);
        }
    }
    shouldComponentUpdate(nextProps) {
        return !(
            this.props.status === nextProps.status
        );
    }
    imageLoad = () => {
        if (this.props.isHistory) {
            scrollHistoryMessage();
        } else {
            scrollMessage();
        }
    }
    renderText = () => (
        this.props.content.split(/\n/).map((m, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: m }} />
        ))
    )
    renderUrl = () => {
        const { content } = this.props;
        return (
            <a href={content} rel="noopener noreferrer" target="_blank">{content}</a>
        );
    }
    renderCode = () => {
        let { content } = this.props;
        const lang = /^!!!lang=(.+)!!!/.exec(content);
        if (lang) {
            content = content.replace(lang[0], '');
        }
        return (
            <Highlight className={`code ${(lang && lang[1]) || ''}`}>
                {content}
            </Highlight>
        );
    }
    renderImage = () => {
        const { content } = this.props;
        return (
            <img
                src={content}
                ref={(i) => this.img = i}
                onLoad={this.imageLoad}
                onError={() => this.img.src = require('../assets/images/image_not_found.png')}
            />
        );
    }
    renderFile = () => {
        const { content } = this.props;
        const name = content.get('name');
        const url = content.get('url');
        let size = content.get('size');
        let unit = 'B';
        if (size > 1024) {
            size /= 1024;
            unit = 'KB';
        }
        if (size > 1024) {
            size /= 1024;
            unit = 'MB';
        }
        return (
            <div className="file">
                <Icon icon="icon-file" size={36} />
                <div>
                    <p>{name}</p>
                    <p>{size.toFixed(2) + unit}</p>
                </div>
                <a href={url} download>
                    <Icon icon="icon-upload-demo" size={28} />
                </a>
            </div>
        );
    }
    renderContent = () => {
        switch (this.props.type) {
        case 'text':
            return this.renderText();
        case 'url':
            return this.renderUrl();
        case 'code':
            return this.renderCode();
        case 'image':
            return this.renderImage();
        case 'file':
            return this.renderFile();
        default:
            return <span>未知消息</span>;
        }
    }
    render() {
        const { avatar, username, time, isSimple, status } = this.props;
        return (
            isSimple ?
                <div className="message-simple" ref={(i) => this.msg = i}>
                    <Spin spinning={status === 'sending'} size="small">
                        <div className="container">
                            { this.renderContent() }
                        </div>
                    </Spin>
                </div>
            :
                <div className="message" ref={(i) => this.msg = i}>
                    <Spin spinning={status === 'sending'} size="small">
                        <Avatar className="avatar" width={36} height={36} src={avatar} circular />
                        <div className="content">
                            <div>
                                <span>{username}</span>
                                <span className="time">{format('yyyy-MM-dd hh:mm:ss', new Date(time))}</span>
                            </div>
                            <div>{ this.renderContent() }</div>
                        </div>
                    </Spin>
                </div>

        );
    }
}

export default connect(
    ($$state, { isSelfSend }) => ({
        shouldScroll: $$state.getIn(['view', 'autoScroll']) || isSelfSend,
    }),
)(Message);
