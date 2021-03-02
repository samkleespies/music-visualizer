import React, { Component } from 'react';
import { useState } from 'react';
// mp3 imports
import saymyname from "./saymyname.mp3";
import light from "./light.mp3";
import add from "./add.mp3";
import lystd from "./lystd.mp3";
// album art imports
import odeszaart from "./odesza-album-art.jpg";
import lightart from "./light-album-art.jpg";
import addart from "./add-album-art.jpg";
import lystdart from "./lystd-album-art.jpg";
// fontawesome imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { faPause } from '@fortawesome/free-solid-svg-icons';
import { faStop } from '@fortawesome/free-solid-svg-icons';
import { faVolumeMute } from '@fortawesome/free-solid-svg-icons';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons';
// material imports
import Paper from '@material-ui/core/Paper';
// other

// stylesheet imports
import './App.css';

function getTime(time) 
{
  if(!isNaN(time)) 
  {
    return Math.floor(time / 60) + ':' + ('0' + Math.floor(time % 60)).slice(-2)
  }
}

class App extends Component 
{
  state = 
  {
    selectedSong: null,
    player: "stopped",
    currentTime: null,
    duration: null,
    visible: false,
    open: null,
    glow: false,
    art: null,
    volume: 1,
    playbackRate: 1,
    muted: false
  }
  
  // update/mount changes
  componentDidUpdate(prevProps, prevState)
  {
    if (this.state.selectedSong !== prevState.selectedSong)
    {
      this.state.playbackRate = 1;
      let song;
      switch (this.state.selectedSong)
      {
        case "Odesza - Say My Name":
          song = saymyname
        break;
        case "San Holo - Light":
          song = light;
        break;
        case "Dwilly - ADD":
          song = add;
        break;
        case "Daft Punk - Lose Yourself to Dance":
          song = lystd;
        break;
        default:
        break;
      }
      if (song)
      {
        this.player.src = song;
        this.player.play()
        this.setState({player: "playing"})
      }
    }

    if (this.state.player !== prevState.player)
    {
      if (this.state.player === "paused")
      {
        this.player.pause();
      }
      else if (this.state.player === "stopped")
      {
        this.player.pause();
        this.source.disconnect();
        this.player.currentTime = 0;
        this.setState({ selectedSong: null, open: null });
      }
      else if (this.state.player === "playing" && prevState.player === "paused")
      {
        this.player.play();
      }
    }

    if (this.state.volume != prevState.volume)
    {
      this.player.volume = this.state.volume;
    }

    if (this.state.playbackRate != prevState.playbackRate)
    {
      this.player.playbackRate = this.state.playbackRate;
    }

    if (this.state.wet != prevState.wet)
    {
      this.pitchShift.wet.value = this.state.wet;
    }

    if (this.state.dry != prevState.dry)
    {
      this.pitchShift.dry.value = this.state.dry;
    }

    if (this.state.transpose != prevState.transpose)
    {
      this.pitchShift.transpose = this.state.transpose;
    }

    if (this.state.muted != prevState.muted)
    {
      if (this.state.muted === false)
      {
        this.player.volume = prevState.volume;
      }
      else
      {
        this.player.volume = 0;
      }
    }
  }

  componentDidMount()
  {
    this.player.addEventListener("timeupdate", e => 
    {
      this.setState(
      {
        currentTime: e.target.currentTime,
        duration: e.target.duration
      });
      let ratio = this.player.currentTime / this.player.duration;
      let position = (this.timeline.offsetWidth * ratio) + this.timeline.offsetLeft;
      this.positionHandle(position);
    });
  }

  componentWillUnmount()
  {
    this.player.removeEventListener("timeupdate", () => {});
  }

  // timeline bar methods
  positionHandle = (position) => 
  {
    let timelineWidth = this.timeline.offsetWidth - this.handle.offsetWidth;
    let handleLeft = position - this.timeline.offsetLeft;
    if (handleLeft >= 0 && handleLeft <= timelineWidth) 
    {
      this.handle.style.marginLeft = handleLeft + "px";
    }
    if (handleLeft < 0) 
    {
      this.handle.style.marginLeft = "0px";
    }
    if (handleLeft > timelineWidth) 
    {
      this.handle.style.marginLeft = timelineWidth + "px";
    }
  }

  mouseMove = (e) => 
  {
    this.positionHandle(e.pageX);
    this.player.currentTime = ((e.pageX - this.timeline.offsetLeft) / this.timeline.offsetWidth) * this.player.duration;
  }

  mouseDown = (e) => 
  {
    window.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mouseup', this.mouseUp);
  }

  mouseUp = (e) => 
  {
    window.removeEventListener('mousemove', this.mouseMove);
    window.removeEventListener('mouseup', this.mouseUp);
  }

  // frequency visualizer methods
  frequencyBandArray = [...Array(25).keys()];
  amplitudeValues = null;
  initializeAudioAnalyser = () =>
  {
    if (this.audioContext == undefined && this.source == undefined)
    {
      this.audioContext = new AudioContext(this.player);
      this.source = this.audioContext.createMediaElementSource(this.player);
      this.PitchShift = require('./soundbank-pitch-shift');
      this.pitchShift = this.PitchShift(this.audioContext);
      this.pitchShift.connect(this.audioContext.destination);
    }
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 1024;
    this.source.connect(this.pitchShift);
    // this.source.connect(this.audioContext.destination);
    this.pitchShift.connect(this.analyser);
      this.setState(
      {
        transpose: 0,
        wet: 0,
        dry: 0.5,
        audioData: this.analyser
      })
    this.pitchShift.transpose = 0;
    this.pitchShift.wet.value = 0;
    this.pitchShift.dry.value = 0.5;
  }

  getFrequencyData = (styleAdjuster) =>
  {
    const bufferLength = this.state.audioData.frequencyBinCount;
    const amplitudeArray = new Uint8Array(bufferLength);
    this.state.audioData.getByteFrequencyData(amplitudeArray)
    styleAdjuster(amplitudeArray)
  }

  adjustFreqBandStyle = (newAmplitudeData) =>
  {
    var amplitudeValues = newAmplitudeData;
    let domElements = this.frequencyBandArray.map((num) =>
      document.getElementById(num))
    for(let i=0; i<this.frequencyBandArray.length; i++)
    {
      let num = this.frequencyBandArray[i]
      domElements[num].style.backgroundColor = `rgb(0, ${amplitudeValues[num]}, 210)`
      domElements[num].style.height = `${amplitudeValues[num]}px`
    }
  }

  runSpectrum = () =>
  {
    this.getFrequencyData(this.adjustFreqBandStyle)
    requestAnimationFrame(this.runSpectrum)
  }

  handleClick = () =>
  {
    this.initializeAudioAnalyser();
    requestAnimationFrame(this.runSpectrum);
  }

  render() 
  {
    const songList = 
    [
      {id: "odsza", title: "Odesza - Say My Name", glow: "odsza glow", art: odeszaart, name: saymyname},
      {id: "snholo", title: "San Holo - Light", glow: "snholo glow", art: lightart, name: light},
      {id: "dwilly", title: "Dwilly - ADD", glow: "dwilly glow", art: addart, name: add},
      {id: "dftpnk", title: "Daft Punk - Lose Yourself to Dance", glow: "dftpnk glow", art: lystdart, name: lystd}
    ].map(item => 
      {
        return (
          <li 
            key={item.id}
            onClick={() => {this.setState({ selectedSong: item.title, open: item.id, art: item.art, currSong: item.name}, 
                () => {this.handleClick();})}}
          >
            <div className= {this.state.open === item.id ? item.glow : item.id} style={{cursor:'pointer'}}>
              {item.title}
            </div>
          </li>
        );
      });
    
    const currentTime = getTime(this.state.currentTime);
    const duration = getTime(this.state.duration);
    const playerbox = this.state.player === 'stopped' ? 'App-playerbox hide' : 'App-playerbox';
    const visualizer = this.state.player === 'stopped' ? 'visualbox-wrapper hide' : 'visualbox-wrapper';
    const volumeslider = this.state.player === 'stopped' ? 'volume-slider hide' : 'volume-slider';
    const currArt = this.state.art;
    const playButton = <FontAwesomeIcon icon={faPlay} />;
    const pauseButton = <FontAwesomeIcon icon={faPause} />;
    const stopButton = <FontAwesomeIcon icon={faStop} />;
    const mutedButton = <FontAwesomeIcon icon={faVolumeMute} />;
    const unmutedButton = <FontAwesomeIcon icon={faVolumeUp} />;

    return (
    <>
      <div className="App">
        <h1 className="App-header">Music Player</h1>
        <ul className="App-songlist">
          {songList}
        </ul>
        <div className={playerbox}>
          <img className="App-albumart" src={currArt} alt="AlbumArt" />
          <div className="timeline" onClick={this.mouseMove} ref={(timeline) => { this.timeline = timeline }}>
            <div className="handle" onMouseDown={this.mouseDown} ref={(handle) => { this.handle = handle }}/>
          </div>
          <div className="App-buttons">
            {this.state.player === "paused" && (
              <button class="App-icons" onClick={() => this.setState({ player: "playing"})}>{playButton}</button>
            )}
            {this.state.player === "playing" && (
              <button class="App-icons" onClick={() => this.setState({ player: "paused"})}>{pauseButton}</button>
            )}
            {this.state.player === "playing" || this.state.player === "paused" ? (
              <button class="App-icons" onClick={() => this.setState({ player: "stopped"})}>{stopButton}</button>
            ) : (
              ""
            )}
          </div>
          <div className="App-timer">
            {this.state.player === "playing" || this.state.player === "paused" ? (
              <div>
                {currentTime} / {duration}
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        <div>
          <div>
            <span className={visualizer}>
              <span className="visualbox">
                {this.frequencyBandArray.map((num) =>
                  <Paper
                    className={'frequencyBands'}
                    elevation={4}
                    id={num}
                    key={num}
                  />
                )}
              </span>
              <span className="vis-stylebox"></span>
            </span>
          </div>
        </div>
        <span className={volumeslider}>
          <div className="visbuttons">
            {this.state.muted === true && (
              <button className="button button-mute" onClick={() => {this.setState({ muted: false })}}>{mutedButton}</button>
            )}
            {this.state.muted === false && (
              <button className="button button-mute" onClick={() => {this.setState({ muted: true })}}>{unmutedButton}</button>
            )}
            <div className="button button-playbackrate"><b>{this.state.playbackRate}x</b></div>
            <div className="volume-bar">
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={this.state.volume}
                onChange={event => {
                  this.setState({ volume: event.target.valueAsNumber })
                }}
              />
            </div>
            <span className="vol-stylebox"></span>
            <div className="playbackrate-bar">
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.1}
                value={this.state.playbackRate}
                onChange={event => {
                  this.setState({ playbackRate: event.target.valueAsNumber })
                }}
              />
            </div>
            <span className="playback-stylebox"></span>
            <div className="button transpose-text"><b>Transpose: {this.state.transpose}</b></div>
            <div className="transpose-bar">
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={this.state.transpose}
                onChange={event => {
                  this.setState({ transpose: event.target.valueAsNumber })
                }}
              />
            </div>
            <div className="button wet-text"><b>Wet: {this.state.wet}</b></div>
            <div className="wet-bar">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={this.state.wet}
                onChange={event => {
                  this.setState({ wet: event.target.valueAsNumber })
                }}
              />
            </div>
            <div className="button dry-text"><b>Dry: {this.state.dry}</b></div>
            <div className="dry-bar">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={this.state.dry}
                onChange={event => {
                  this.setState({ dry: event.target.valueAsNumber })
                }}
              />
            </div>
            <span className="pitch-stylebox"></span>
          </div>
        </span>
      </div>
      <audio ref={ref => this.player = ref} />
    </>
    );
  }
}

export default App;
