import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

const Logo = ({ className = "", width = 24, height = 24 }: LogoProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <circle cx="12" cy="12" r="11" fill="#3B82F6"/>
    <path 
      d="M6 15L12 9L18 15" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M6 19L12 13L18 19" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      opacity="0.5"
    />
    <path 
      d="M6 11L12 5L18 11" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      opacity="0.25"
    />
  </svg>
)

export default Logo;
