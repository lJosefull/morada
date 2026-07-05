declare namespace JSX {
  interface IntrinsicElements {
    'altcha-widget': AltchaWidgetAttributes;
  }
}

interface AltchaWidgetAttributes extends React.HTMLAttributes<HTMLElement> {
  challengeurl?: string;
  challengejson?: string;
}

interface AltchaWidgetElement extends HTMLElement {
  value: string;
}
