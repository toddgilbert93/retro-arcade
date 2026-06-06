import {
  Shader,
  BarShift,
  Dither,
  Stretch,
  Stripes,
  WaveDistortion,
} from 'shaders/react'

export function BattleCardShader() {
  return (
    <Shader className="size-full opacity-10">
      <Stripes
        angle={90}
        balance={0.77}
        colorA="#ffffff47"
        density={1}
        softness={0.57}
        speed={0.04}
      />
      <Stretch
        center={{
          x: 0.2,
          y: 0.52,
        }}
        falloff={0.49}
        strength={0}
        visible={false}
      />
      <BarShift
        count={30}
        intensity={{
          type: 'auto-animate',
          mode: 'ping-pong',
          outputMin: 0,
          outputMax: 1,
          speed: 1,
          easing: 'sine',
        }}
        seed={27}
        visible
      />
      <BarShift
        angle={90}
        count={7}
        intensity={{
          type: 'auto-animate',
          mode: 'ping-pong',
          outputMin: 0.61,
          outputMax: 0.15,
          speed: 0.2,
          easing: 'sine',
        }}
        seed={27}
        visible
      />
      <WaveDistortion
        strength={0.1}
        transform={{
          offsetX: 0.6,
          offsetY: -0.47,
          rotation: 303,
        }}
        visible={false}
        waveType="square"
      />
      <Dither
        colorA="#ffffff0d"
        colorB="#00000000"
        pixelSize={16}
        threshold={0.86}
      />
    </Shader>
  )
}
