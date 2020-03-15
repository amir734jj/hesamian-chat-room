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

    recordToggle = callback => async () => {
        if (this.state.recording) {
            this.state.recorder.stop();
            this.state.stream.getAudioTracks()[0].stop();
            this.setState({stream: null, recorder: null, recording: false});
        } else {
            let stream = await navigator.mediaDevices.getUserMedia({audio: true});
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
                        <button type="submit" className="btn btn-primary" key={'send'} disabled={this.state.recording}>
                            Send
                        </button>
                        <button type='button' className={classNames('btn', {
                            'btn-default': !this.state.recording,
                            'btn-danger': this.state.recording
                        })} key={'record'}
                                onClick={this.recordToggle(voice => this.setState({voice}))}>
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

    formatAudioResponse = (voice, index) => {
        let blob = blobUtil.base64StringToBlob(voice);
        const source = URL.createObjectURL(blob);

        return (
            <div key={`audio-${index}`}>
                <audio id="audio" controls autoPlay={!index}>
                    <source id="source" src={source} type="audio/ogg"/>
                </audio>
            </div>
        );
    };

    render() {
        return (
            <div>
                {this.state.initialized ? (
                    <div className={'row'}>
                        <span className="label label-primary pull-right"> {this.state.name}</span>

                        <Messenger itemClass={'col-md-12'} submitHandler={this.sendMessage}/>

                        <div className={'col-md-12'}>
                            {this.state.messages.map(({name, time, text, voice}, i) => (
                                <div className="panel-group" key={i}>
                                    <div className="panel panel-default">
                                        <div className="panel-heading"
                                             key={'header'}> {name} @ {this.formatTime(time)}</div>
                                        <div className="panel-body" key={'body'}>
                                            {text}
                                            {text && voice ? (<hr/>) : null}
                                            {voice ? this.formatAudioResponse(voice, i) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='clearfix scol-md-12'>
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
