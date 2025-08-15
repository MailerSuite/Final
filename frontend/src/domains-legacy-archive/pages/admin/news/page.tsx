import React, { useEffect, useState, FormEvent } from "react";
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import {
  Newspaper,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  User,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  EyeOff
} from 'lucide-react';
import axios from 'axios';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  priority: 'low' | 'medium' | 'high';
}

const AdminNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium" as const,
    published: false
  });

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/news');
      setNews(response.data);
      toast.success('📰 News loaded - LIVE DATA!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to load news';
      toast.error(errorMessage);
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setCreating(true);
      await axios.post('/api/v1/admin/news', formData);
      setFormData({ title: "", content: "", priority: "medium", published: false });
      setCreateDialogOpen(false);
      await loadNews();
      toast.success('News item created successfully!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to create news';
      toast.error(errorMessage);
      console.error('Error creating news:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (newsId: number) => {
    if (!confirm('Are you sure you want to delete this news item?')) return;

    try {
      await axios.delete(`/api/v1/admin/news/${newsId}`);
      await loadNews();
      toast.success('News item deleted successfully!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete news';
      toast.error(errorMessage);
      console.error('Error deleting news:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border/30';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-muted/20 to-muted/30 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-muted/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-muted/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-3 bg-primary/20 rounded-xl backdrop-blur-sm border border-primary/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Newspaper className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-muted bg-clip-text text-transparent">
              News Management
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage platform announcements and news - <span className="text-green-400 font-semibold">LIVE DATA!</span>
          </p>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1 bg-primary/20 border-primary/30 text-primary-300">
              {news.length} News Items
            </Badge>
            <Badge variant="outline" className="px-3 py-1 bg-green-500/20 border-green-500/30 text-green-300">
              {news.filter(n => n.published).length} Published
            </Badge>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={loadNews}
              disabled={loading}
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create News
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 border-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center space-x-2">
                    <Newspaper className="w-5 h-5 text-primary" />
                    <span>Create News Item</span>
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter news title..."
                      className="bg-card/50 border-border text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Content</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter news content..."
                      className="bg-card/50 border-border text-white min-h-[100px]"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value: unknown) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger className="bg-card/50 border-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Published</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          checked={formData.published}
                          onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    >
                      {creating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create News
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* News Grid */}
        <motion.div
          className="grid gap-6"
          variants={containerVariants}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Loading news...</span>
              </div>
            </div>
          ) : news.length === 0 ? (
            <motion.div
              className="text-center py-12"
              variants={itemVariants}
            >
              <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No News Items</h3>
              <p className="text-muted-foreground">Create your first news item to get started.</p>
            </motion.div>
          ) : (
            news.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                          <Badge className={`px-2 py-1 text-xs ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </Badge>
                          {item.published ? (
                            <Badge className="px-2 py-1 text-xs bg-green-500/20 text-green-300 border-green-500/30">
                              <Eye className="w-3 h-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge className="px-2 py-1 text-xs bg-muted/20 text-muted-foreground border-border/30">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{item.author}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </span>
                          {item.updated_at !== item.created_at && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-500/20 border-red-500/30 hover:bg-red-500/40 text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {item.content && (
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground leading-relaxed">{item.content}</p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminNews;