import React from 'react';
import { 
  Terminal, 
  Briefcase, 
  BookOpen, 
  Sprout, 
  Calculator, 
  Brain, 
  MessageSquarePlus, 
  MessageSquare,
  Menu,
  X,
  Send,
  User,
  Bot,
  Github,
  LogOut,
  Globe,
  Lock,
  Mail,
  ChevronRight,
  Settings,
  Download,
  Trash2,
  Bell,
  HelpCircle,
  MoreVertical,
  FileText,
  Zap,
  Moon,
  Sun,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  Wand2,
  Volume2,
  Square,
  Bug,
  AlertCircle,
  CheckCircle,
  Eye,
  Search,
  RefreshCw,
  Home,
  Users,
  Activity,
  BarChart3,
  Shield
} from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, className, size = 20 }) => {
  const icons: Record<string, React.ElementType> = {
    'Terminal': Terminal,
    'Briefcase': Briefcase,
    'BookOpen': BookOpen,
    'Sprout': Sprout,
    'Calculator': Calculator,
    'Brain': Brain,
    'MessageSquarePlus': MessageSquarePlus,
    'MessageSquare': MessageSquare,
    'Menu': Menu,
    'X': X,
    'Send': Send,
    'User': User,
    'Bot': Bot,
    'Github': Github,
    'LogOut': LogOut,
    'Chrome': Globe,
    'Lock': Lock,
    'Mail': Mail,
    'ChevronRight': ChevronRight,
    'Settings': Settings,
    'Download': Download,
    'Trash2': Trash2,
    'Bell': Bell,
    'HelpCircle': HelpCircle,
    'MoreVertical': MoreVertical,
    'FileText': FileText,
    'Zap': Zap,
    'Moon': Moon,
    'Sun': Sun,
    'Paperclip': Paperclip,
    'Mic': Mic,
    'MicOff': MicOff,
    'Image': ImageIcon,
    'Wand2': Wand2,
    'Volume2': Volume2,
    'Square': Square,
    'Bug': Bug,
    'AlertCircle': AlertCircle,
    'CheckCircle': CheckCircle,
    'Eye': Eye,
    'Search': Search,
    'RefreshCw': RefreshCw,
    'Home': Home,
    'Users': Users,
    'Activity': Activity,
    'BarChart3': BarChart3,
    'Shield': Shield
  };

  const IconComponent = icons[name] || MessageSquare;

  return <IconComponent className={className} size={size} />;
};

export default Icon;