function recordPolyfill(onGetUserMedia, onGetUserMediaError) {
    // from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = constraints => {

            // First get a hold of the legacy getUserMedia, if present
            let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

            // Some browsers just don't implement it - return a rejected promise with an error
            // to keep a consistent interface
            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
            }

            // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
            return new Promise((resolve, reject) => {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        };
    }

    if (navigator.getUserMedia) {
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(onGetUserMedia)
            .catch(onGetUserMediaError);
    }
}

class BasicComponent extends React.Component {

    handleSubmit = submitHandler => event => {
        event.preventDefault();

        submitHandler(this.state);

        this.setState(this.defaultState);
    };
}

class Info extends BasicComponent {
    constructor() {
        super();
        this.state = this.defaultState = {
            name: ""
        };
    }

    render() {
        const {submitHandler} = this.props;

        return (
            <form onSubmit={this.handleSubmit(submitHandler)}>
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="name"
                        className="form-control"
                        id="name"
                        onChange={event => this.setState({name: event.target.value})}
                    />
                </div>
                <div className="form-group">
                    <button type="submit" className="btn btn-success">
                        Submit
                    </button>
                </div>
            </form>
        );
    }
}

class Messenger extends BasicComponent {

    constructor() {
        super();
        this.state = this.defaultState = {
            text: '',
            recording: false,
            stream: null,
            recorder: null,
            voice: null
        };
    }

    recordToggle = callback => () => {
        if (this.state.recording) {
            this.state.recorder.stop();
            this.state.stream.getAudioTracks()[0].stop();
            this.setState({stream: null, recorder: null, recording: false});
        } else {
            recordPolyfill(async stream => {
                let recorder = new MediaRecorder(stream);

                await this.setState({stream, recorder, recording: true});

                recorder.ondataavailable = async e => {
                    let blob = e.data;
                    await this.setState({recording: false});

                    blobUtil.blobToBase64String(blob).then((base64String) => {
                        // success
                        callback(base64String);
                    }).catch((err) => {
                        // error
                        console.error(err);
                    });
                };

                recorder.start();
            }, err => console.error(err));
        }
    };

    render() {
        const {submitHandler, itemClass} = this.props;

        return (
            <form onSubmit={this.handleSubmit(submitHandler)} className={itemClass}>
                <div className="form-group">
                    <label htmlFor="message">Write the message text:</label>
                    <textarea className="form-control" id="message" placeholder="Enter message"
                              value={this.state.text}
                              onChange={event => this.setState({text: event.target.value})}/>
                </div>

                <div className="form-group">
                    <div className={'btn-group'}>
                        <button type="submit" className="btn btn-primary" disabled={this.state.recording}>
                            Send
                        </button>
                        <button type='button' className={classNames('btn', {
                            'btn-default': !this.state.recording,
                            'btn-danger': this.state.recording
                        })} onClick={this.recordToggle(voice => this.setState({voice}))}>
                            {!this.state.recording ? 'Record' : 'Stop'}
                        </button>
                    </div>
                </div>
            </form>
        );
    }
}

class Chat extends React.Component {
    constructor() {
        super();
        this.formatTime = time => new Date(time).toLocaleTimeString();
        this.state = {
            messages: [],
            name: "",
            logs: [],
            initialized: false
        };
    }

    componentDidMount() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("/chat")
            .build();

        this.connection.on("Log", (event, count) => {
            this.setState(({logs}) => logs.unshift(`Event: ${event}: #${count}`));
        });

        this.connection.on("Announce", (_, name) => {
            this.setState(({logs}) => logs.unshift(`Announced: ${name}`));
        });

        this.connection.on("Inbox", message => {
            const {name, time} = message;

            this.setState(({logs}) => logs.unshift(`Echo from ${name} @ ${this.formatTime(time)}`));
            this.setState(({messages}) => messages.unshift(message));
        });

        this.connection.start();
    }

    componentWillUnmount() {
        this.connection.stop();
    }

    setInfoHandler = async ({name}) => {
        await this.setState({initialized: true, name});

        await this.connection.invoke("Announce", this.state);
    };

    sendMessage = async message => {
        await this.connection.invoke("Echo", Object.assign({time: new Date()}, message, this.state));
    };

    formatAudioResponse = (voice, flag) => {
        let blob = blobUtil.base64StringToBlob(voice);
        const source = URL.createObjectURL(blob);

        return (
            <audio id="audio" controls autoPlay={!flag}>
                <source id="source" src={source} type="audio/ogg"/>
            </audio>
        );
    };

    render() {
        return (
            <div>
                {this.state.initialized ? (
                    <div className={'row'}>
                        <span className="label label-primary pull-right"
                              style={{marginRight: '2rem'}}> {this.state.name}</span>

                        <Messenger itemClass={'col-sm-12'} submitHandler={this.sendMessage}/>

                        <div className={'col-sm-12'}>
                            {this.state.messages.map(({name, time, text, voice}, i) => (
                                <div className="panel-group" key={Math.random()}>
                                    <div className="panel panel-default">
                                        <div className="panel-heading"> {name} @ {this.formatTime(time)}</div>
                                        <div className="panel-body">
                                            {text}
                                            {text && voice ? (<hr/>) : null}
                                            {voice ? this.formatAudioResponse(voice, i) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='clearfix scol-sm-12'>
                            <pre>
                                {this.state.logs.join("\n")}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <Info submitHandler={this.setInfoHandler}/>
                )}
            </div>
        );
    }
}

class App extends React.Component {
    render() {
        return (
            <div>
                <h3>Chat Room</h3>
                <Chat/>
            </div>
        );
    }
}

ReactDOM.render(<App/>, document.getElementById("app"));
